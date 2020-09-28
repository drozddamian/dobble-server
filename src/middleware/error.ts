import { handleError } from '../helpers/error'

export default (err, req, res, next) => {
  handleError(err, res)
}
