export enum API_METHODS {
  LOGIN = '/login',
  REGISTER = '/register',
  GET_PLAYER = '/:username',
  MODIFY_PLAYER = '/change_data',
  GET_ROOMS = '/list_rooms',
  GET_MOST_POPULAR_ROOMS = '/most_popular',
  GET_ROOM = '/:roomId',
  CREATE_ROOM = '/create_room',
  DELETE_ROOM = '/:roomId',
}
