export enum API_METHODS {
  LOGIN = '/login',
  REGISTER = '/register',
  LOGOUT = '/logout',
  GET_PLAYER = '/:id',
  MODIFY_PLAYER = '/change_data',
  GET_ROOMS = '/list_rooms',
  GET_MOST_POPULAR_ROOMS = '/most_popular',
  GET_ROOM = '/:roomId',
  CREATE_ROOM = '/create_room',
  DELETE_ROOM = '/:roomId',
  JOIN_ROOM = '/join_room',
  LEAVE_ROOM = '/leave_room',
}
