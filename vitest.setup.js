// Import bluebird during setup so its internal Promise detection
// probe isn't tracked as a leak by detectAsyncLeaks.
import 'bluebird';
