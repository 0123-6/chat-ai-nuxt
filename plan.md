联调下面2个接口

# 手机号登录时获取验证码接口
api /auth/getCode
method: post
request: {
  phone: '',
}
// 成功
response: {
  code: 200,
  msg: '验证码发送成功',
  data: undefined,
}
// 失败
response: {
  code: 999,
  msg: '请输入合法手机号',// 正常通过前端调用不会触发,因为前端已经校验,但要考虑兼容这种情况
}

# 通过手机号登录
api: /loginByPhone
method: post
request: {
  phone: '',// 需要先校验为/^1[3-9]\d{9}$/.test(phone)
  code: '',//需要先校验为4位合法数字/^\d{4}$/,但实际是字符串类型
}
正常
response: {
  code: 200,
  msg: '操作成功',
  data: {
    // 用户的信息,参见useUserStore.ts IUserInfo,并将信息保存在全局状态中
  },
}
