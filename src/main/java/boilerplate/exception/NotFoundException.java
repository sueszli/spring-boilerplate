package boilerplate.exception;

import lombok.NoArgsConstructor;
import lombok.experimental.StandardException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * A {@link java.lang.RuntimeException} that should be used when something (primarily an entity) a
 * user requests could not be found. The exception will automatically be caught by the framework and
 * the request will fail with {@link org.springframework.http.HttpStatus#NOT_FOUND}.
 */
@NoArgsConstructor
@StandardException
@ResponseStatus(HttpStatus.NOT_FOUND)
public class NotFoundException extends RuntimeException {}
