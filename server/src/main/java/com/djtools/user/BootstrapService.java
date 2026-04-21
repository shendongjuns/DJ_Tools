package com.djtools.user;

import com.djtools.common.ApiException;
import com.djtools.config.MinioProperties;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BootstrapService implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(BootstrapService.class);

    private final UserAccountMapper userAccountMapper;
    private final PasswordEncoder passwordEncoder;
    private final MinioClient minioClient;
    private final MinioProperties minioProperties;

    public BootstrapService(
            UserAccountMapper userAccountMapper,
            PasswordEncoder passwordEncoder,
            MinioClient minioClient,
            MinioProperties minioProperties
    ) {
        this.userAccountMapper = userAccountMapper;
        this.passwordEncoder = passwordEncoder;
        this.minioClient = minioClient;
        this.minioProperties = minioProperties;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        if (userAccountMapper.countAll() == 0) {
            UserAccount admin = new UserAccount();
            admin.setNickname("admin");
            admin.setLoginAccount("admin");
            admin.setPasswordHash(passwordEncoder.encode("123456"));
            admin.setPasswordChanged(false);
            admin.setForcePasswordChange(true);
            admin.setThemeId("cartoon");
            userAccountMapper.insert(admin);
            log.info("已初始化默认管理员账号 admin，首次登录需要修改密码。");
        }

        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder().bucket(minioProperties.getBucket()).build()
            );
            if (!exists) {
                minioClient.makeBucket(MakeBucketArgs.builder().bucket(minioProperties.getBucket()).build());
                log.info("已自动创建 MinIO bucket: {}", minioProperties.getBucket());
            }
        } catch (Exception exception) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "MinIO 初始化失败: " + exception.getMessage());
        }
    }
}

