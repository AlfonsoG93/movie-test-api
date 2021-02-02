export interface RegisterResponse extends UserInfo {
  token: string
}

export interface LoginResponse extends UserInfo {
  token: string
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
}

export interface Context {
  userInfo: UserInfo;
}
