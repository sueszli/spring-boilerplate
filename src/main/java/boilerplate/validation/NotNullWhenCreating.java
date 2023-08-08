package boilerplate.validation;

import jakarta.servlet.http.HttpServletRequest;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;
import java.util.Objects;
import javax.validation.Constraint;
import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;
import javax.validation.Payload;
import lombok.RequiredArgsConstructor;
import lombok.val;
import org.springframework.web.bind.annotation.RequestMethod;

/**
 * Validates that a property is not null when the object that defines it is provided in a POST endpoint call (e.g. to create an entity).
 * When provided in an endpoint of another method (like a DELETE request) the property may be null.
 * See {@link NotNullWhenCreatingValidator} for the implementation.
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Constraint(validatedBy = { NotNullWhenCreatingValidator.class })
public @interface NotNullWhenCreating {
    String message() default "";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};
}

@RequiredArgsConstructor
abstract class NotNullWhenCreatingValidator implements ConstraintValidator<NotNullWhenCreating, Object> {

    private final HttpServletRequest request;

    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {
        if (request == null) {
            return true;
        }
        val isPutOrPostRequest =
            Objects.equals(request.getMethod(), RequestMethod.POST.name()) || Objects.equals(request.getMethod(), RequestMethod.PUT.name());
        val invalid = (value == null) && isPutOrPostRequest;
        return !invalid;
    }
}
