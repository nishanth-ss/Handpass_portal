export type UserData = {
  id: string;
  name: string;
  email: string;
  role: string;
  sn: string;
  user_id: string;
  image_left: string;
  wiegand_flag: number;
  admin_auth: number;
  created_at: string;
  updated_at: string;
};

export type UserPagination = {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
};

export type UserResponse = {
  code: number;
  msg: string;
  data: UserData[];
  pagination: UserPagination;
};


// single user
export interface SingleUserWithGroupsResponse {
  code: number;
  msg: string;
  data: UserWithGroups;
}

export interface UserWithGroups {
  id: string;
  name: string;
  email: string | null;
  password_hash: string | null;
  sn: string | null;
  user_id: string | null;
  role: string;
  image_left: string | null;
  image_right: string | null;
  wiegand_flag: number;
  admin_auth: number;
  created_at: string;
  updated_at: string;
}
