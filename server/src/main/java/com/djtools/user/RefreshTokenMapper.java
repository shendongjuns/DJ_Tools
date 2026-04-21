package com.djtools.user;

import java.time.OffsetDateTime;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface RefreshTokenMapper {

    int insert(RefreshTokenRecord refreshTokenRecord);

    RefreshTokenRecord findActiveByToken(@Param("token") String token);

    int revokeByToken(@Param("token") String token);

    int revokeByUserId(@Param("userId") Long userId);

    int revokeExpired(@Param("now") OffsetDateTime now);
}
