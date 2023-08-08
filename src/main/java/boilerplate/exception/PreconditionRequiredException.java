package boilerplate.exception;

import lombok.NoArgsConstructor;
import lombok.experimental.StandardException;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Should be used when an action can not be performed because a precondition was not met.
 */
@NoArgsConstructor
@StandardException
@ResponseStatus(HttpStatus.PRECONDITION_REQUIRED)
public class PreconditionRequiredException extends RuntimeException {}
