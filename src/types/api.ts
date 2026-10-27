export interface ICustomError {
  data: any;
  status: number;
}

export interface IPaginatedResponse<T> {
  count: number;
  next: null | string;
  previous: null | string;
  results: T[];
}
