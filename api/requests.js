import { createHandler } from '../lib/requests.mjs';
import { saveRequest } from '../lib/database.mjs';
export default createHandler(saveRequest);
