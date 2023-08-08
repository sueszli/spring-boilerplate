package boilerplate;

import boilerplate.exception.NotFoundException;
import boilerplate.validation.NotNullWhenCreating;
import jakarta.persistence.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.*;
import lombok.extern.slf4j.Slf4j;
import org.mapstruct.Mapper;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Repository;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RequiredArgsConstructor
@Validated
@RequestMapping("${routes.rest.v1}/duck")
@RestController
public class DuckController {

    private final DuckMapper mapper;
    private final DuckRepository repository;
    private final SseConnectionManager sse;

    @ResponseStatus(HttpStatus.CREATED)
    @PostMapping
    public Duck save(@Valid @RequestBody DuckDto dto) {
        log.info("POST duck: {}", dto);
        val entity = mapper.toEntity(dto);
        val saved = repository.save(entity);
        sse.broadcast(SseConnectionManager.SseEvent.CREATE, saved);
        return saved;
    }

    @ResponseStatus(HttpStatus.OK)
    @GetMapping("/{id}")
    public Duck findById(@PathVariable("id") Long id) {
        log.info("GET duck: {}", id);
        validateExists(id);
        return repository.findById(id).get();
    }

    @ResponseStatus(HttpStatus.OK)
    @GetMapping
    public List<Duck> findAll() {
        log.info("GET duck");
        return repository.findAll();
    }

    @ResponseStatus(HttpStatus.OK)
    @PutMapping
    public Duck update(@Valid @RequestBody DuckDto dto) {
        log.info("PUT duck: {}", dto);
        validateExists(Long.valueOf(dto.getId()));
        val entity = mapper.toEntity(dto);
        val updated = repository.save(entity);
        sse.broadcast(SseConnectionManager.SseEvent.UPDATE, updated);
        return updated;
    }

    @ResponseStatus(HttpStatus.OK)
    @DeleteMapping("/{id}")
    public void deleteById(@PathVariable("id") Long id) {
        log.info("DELETE duck: {}", id);
        validateExists(id);
        val deleted = repository.findById(id).get();
        repository.deleteById(id);
        sse.broadcast(SseConnectionManager.SseEvent.DELETE, deleted);
    }

    @ResponseStatus(HttpStatus.OK)
    @DeleteMapping
    public void deleteAll() {
        log.info("DELETE duck");
        val deleted = repository.findAll();
        repository.deleteAll();
        deleted.parallelStream().forEach(e -> sse.broadcast(SseConnectionManager.SseEvent.DELETE, e));
    }

    private void validateExists(Long id) {
        val exists = repository.existsById(id);
        if (!exists) {
            throw new NotFoundException("DUCK with ID " + id + " not found");
        }
    }
}

@Data
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(name = "DUCK", uniqueConstraints = @UniqueConstraint(name = "NAME_CONSTRAINT", columnNames = { "FIRST_NAME", "SECOND_NAME" }))
class Duck {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @Column(name = "ID", precision = 10)
    private Integer id;

    @Column(name = "FIRST_NAME", unique = false, length = 100, nullable = false)
    private String firstName;

    @Column(name = "SECOND_NAME", unique = false, length = 100, nullable = false)
    private String secondName;
}

@Data
@AllArgsConstructor
@NoArgsConstructor
class DuckDto {

    @NotNullWhenCreating
    @Digits(integer = 10, fraction = 0, message = "ID in DUCK must have a maximum of 10 integer digits")
    private Integer id;

    @NotNull(message = "FIRST_NAME in DUCK must not be null")
    @NotBlank(message = "FIRST_NAME in DUCK must not be blank")
    @Size(max = 100, message = "FIRST_NAME in DUCK must have a maximum of 100 characters")
    private String firstName;

    @NotNull(message = "SECOND_NAME in DUCK must not be null")
    @NotBlank(message = "SECOND_NAME in DUCK must not be blank")
    @Size(max = 100, message = "SECOND_NAME in DUCK must have a maximum of 100 characters")
    private String secondName;
}

@Mapper
interface DuckMapper {
    DuckDto toDto(Duck entity);
    Duck toEntity(DuckDto dto);
}

@Repository
interface DuckRepository extends JpaRepository<Duck, Long> {}
