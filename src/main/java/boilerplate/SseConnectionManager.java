package boilerplate;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Function;
import java.util.function.Supplier;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Slf4j
@Validated
@RequestMapping("${routes.rest.v1}/sse")
@RestController
public class SseConnectionManager {

    private final List<SseEmitter> emitterList = new CopyOnWriteArrayList<>(); // no iterator needed for thread safety

    @ResponseStatus(HttpStatus.OK)
    @GetMapping(path = "/subscription", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter subscribeToDataChanges() {
        log.info("GET sse subscriber");
        broadcast(SseEvent.NOTIFICATION, "new user connected to server");

        Supplier<SseEmitter> genEmitter = () -> {
            val timeout = 3_600_000L; // 10 hours
            val emitter = new SseEmitter(timeout);
            emitter.onTimeout(() -> {
                log.info("emitter timeout: {}", emitter);
                emitter.complete();
                emitterList.remove(emitter);
            });
            emitter.onError(error -> {
                log.error("emitter {} resulted in an error: {}", emitter, error.getMessage());
                emitter.complete();
                emitterList.remove(emitter);
            });
            emitter.onCompletion(() -> {
                log.info("emitter {} closed connection", emitter);
            });
            return emitter;
        };
        val emitter = genEmitter.get();
        emitterList.add(emitter);

        return emitter;
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PostMapping("/broadcast/{msg}")
    public void broadcastNotificationEndpoint(@PathVariable("msg") String msg) {
        log.info("POST sse broadcast log: {}", msg);
        broadcast(SseEvent.NOTIFICATION, msg);
    }

    public void broadcast(SseEvent eventType, Object obj) {
        record BroadcastDto(SseEvent eventType, String objectName, Object object) {}
        val objName = obj.getClass().getSimpleName();

        Function<SseEmitter, Boolean> send = emitter -> {
            try {
                val b = new BroadcastDto(eventType, objName, obj);
                emitter.send(SseEmitter.event().data(b, MediaType.APPLICATION_JSON));
            } catch (Exception exception) {
                emitter.completeWithError(exception);
                emitterList.remove(emitter);
                return false;
            }
            return true;
        };

        val success = emitterList.parallelStream().map(send).reduce(true, (a, b) -> a && b);
        if (!success) {
            log.error("failed to send data to a subscriber");
        }
    }

    @Scheduled(fixedRate = 5000)
    public void heartBeat() {
        log.info("sending heartbeat to {} subscribers", emitterList.size());
        broadcast(SseEvent.HEARTBEAT, "heartbeat");
    }

    public enum SseEvent {
        HEARTBEAT,
        NOTIFICATION,
        CREATE,
        UPDATE,
        DELETE,
    }
}
