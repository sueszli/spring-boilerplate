package boilerplate.exception;

import lombok.NoArgsConstructor;
import lombok.experimental.StandardException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * A {@link RuntimeException} that should be used when something (primarily an entity) a user wants
 * to create already exists. The exception will automatically be caught by the framework and the
 * request will fail with {@link org.springframework.http.HttpStatus#CONFLICT}.
 */
@NoArgsConstructor
@StandardException
@ResponseStatus(HttpStatus.CONFLICT)
public class AlreadyExistsException extends RuntimeException {}
