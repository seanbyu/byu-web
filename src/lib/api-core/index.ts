/**
 * API Core Module
 * 서버 사이드 비즈니스 로직 레이어 통합 export
 */

// Repositories
export { BaseRepository } from "./repositories/base.repository";
export {
  BookingRepository,
  createBookingRepository,
} from "./repositories/booking.repository";
export {
  SalonRepository,
  createSalonRepository,
} from "./repositories/salon.repository";
export { CustomerRepository } from "./repositories/customer.repository";

// Services
export {
  BookingService,
  createBookingService,
} from "./services/booking.service";
export type {
  TimeSlot,
  BookingConflictResult,
  CreateBookingParams as ServiceCreateBookingParams,
} from "./services/booking.service";

export {
  SalonService,
  createSalonService,
} from "./services/salon.service";
export type {
  SalonWithStaff,
  SalonBookingData,
} from "./services/salon.service";

export {
  CustomerService,
  createCustomerService,
} from "./services/customer.service";
export type {
  FindOrCreateCustomerParams,
} from "./services/customer.service";
