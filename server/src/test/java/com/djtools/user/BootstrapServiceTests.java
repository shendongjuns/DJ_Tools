package com.djtools.user;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.djtools.common.ApiException;
import com.djtools.config.MinioProperties;
import io.minio.MinioClient;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;

import static org.junit.jupiter.api.Assertions.assertThrows;

class BootstrapServiceTests {

    private MinioClient minioClient;
    private MinioProperties minioProperties;

    @BeforeEach
    void setUp() {
        minioClient = org.mockito.Mockito.mock(MinioClient.class);
        minioProperties = new MinioProperties();
        minioProperties.setBucket("dj-tools-attachments");
    }

    @Test
    void runShouldOnlyInitializeMinioBucketWhenBucketAlreadyExists() throws Exception {
        when(minioClient.bucketExists(any())).thenReturn(true);

        BootstrapService service = new BootstrapService(minioClient, minioProperties);
        service.run(new DefaultApplicationArguments(new String[0]));

        verify(minioClient, never()).makeBucket(any());
    }

    @Test
    void runShouldCreateBucketWhenBucketDoesNotExist() throws Exception {
        when(minioClient.bucketExists(any())).thenReturn(false);

        BootstrapService service = new BootstrapService(minioClient, minioProperties);
        service.run(new DefaultApplicationArguments(new String[0]));

        verify(minioClient).makeBucket(any());
    }

    @Test
    void runShouldThrowApiExceptionWhenMinioInitializationFails() throws Exception {
        when(minioClient.bucketExists(any())).thenThrow(new RuntimeException("boom"));

        BootstrapService service = new BootstrapService(minioClient, minioProperties);

        assertThrows(ApiException.class, () -> service.run(new DefaultApplicationArguments(new String[0])));
    }
}
