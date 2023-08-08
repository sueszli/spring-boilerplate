package boilerplate;

import java.util.Arrays;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import lombok.val;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

@Slf4j
@RequiredArgsConstructor
@Configuration
public class ConfigInit {

    @Profile("test")
    @Bean
    public ApplicationRunner openBrowser() {
        return args -> {
            log.info("opening browser serving static html");
            val url = "http://localhost:8080";
            String cmd = null;

            val os = System.getProperty("os.name").toLowerCase();
            val rt = Runtime.getRuntime();
            if (os.contains("win")) {
                cmd = "rundll32 url.dll,FileProtocolHandler " + url;
            }
            if (os.contains("mac")) {
                cmd = "open " + url;
            }
            if (os.contains("nix") || os.contains("nux")) {
                val browsers = Arrays.toString("google-chrome firefox mozilla epiphany konqueror netscape opera links lynx".split(" "));
                cmd = Arrays.toString(new String[] { "sh", "-c", browsers });
            }

            // rt.exec(cmd);
            log.info("opened browser to {}", url);
        };
    }

    @Profile("test")
    @Bean
    public ApplicationRunner testDatabaseInitializer(DataSource dataSource) {
        return args -> {
            val fileName = "init.sql";
            val script = new ClassPathResource(fileName);
            if (script.exists()) {
                val connection = dataSource.getConnection();
                ScriptUtils.executeSqlScript(connection, script);
                log.info("ran {} successfully", fileName);
            }
        };
    }
}
