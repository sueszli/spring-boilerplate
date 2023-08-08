package boilerplate;

import java.util.Collections;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Slf4j
@RequiredArgsConstructor
@Configuration(proxyBeanMethods = false)
@EnableWebSecurity
@EnableMethodSecurity(securedEnabled = true, jsr250Enabled = true, prePostEnabled = true)
public class ConfigSecurity {
    // @Profile("test")
    // @Bean
    // public CorsConfigurationSource corsConfigurationSource() {
    //     CorsConfiguration configuration = new CorsConfiguration();

    //     val permitAll = Collections.singletonList("*");
    //     configuration.setAllowedHeaders(permitAll);
    //     configuration.setAllowedOrigins(permitAll);

    //     // @formatter:off
    //     val permitMethods = List.of(
    //         HttpMethod.GET.name(),
    //         HttpMethod.POST.name(),
    //         HttpMethod.PUT.name(),
    //         HttpMethod.PATCH.name(),
    //         HttpMethod.DELETE.name(),
    //         HttpMethod.OPTIONS.name(),
    //         HttpMethod.HEAD.name(),
    //         HttpMethod.TRACE.name()
    //     );
    //     // @formatter:on
    //     configuration.setAllowedMethods(permitMethods);

    //     UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    //     source.registerCorsConfiguration("/**", configuration);
    //     log.info("test mode: enabled cors for paths \"{}\"", permitAll);
    //     return source;
    // }

    // @Bean
    // public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    //     http.cors(Customizer.withDefaults());
    //     http.csrf(csrf -> csrf.disable());
    //     http.headers(headers -> headers.frameOptions(frameOptions -> frameOptions.disable())); // enable h2-browser gui
    //     http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.ALWAYS)); // force sessions for sse

    //     return http.build();
    // }
}
