package com.djtools.user;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserAccountMapper {

    UserAccount findById(@Param("id") Long id);

    UserAccount findByLoginAccount(@Param("loginAccount") String loginAccount);

    long countAll();

    int insert(UserAccount userAccount);

    int updateProfile(UserAccount userAccount);

    int updatePassword(UserAccount userAccount);
}
