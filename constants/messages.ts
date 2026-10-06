/**
 * Centralized User-facing Messages for MedStock
 * Structure adheres to DOMAIN_MESSAGES.ACTION.TYPE or domain groups.
 * TypeScript strict with 'as const' and typed parameter functions.
 * Designed for seamless future i18n migration (next-intl / i18next).
 */

export const COMMON_MESSAGES = {
  SUCCESS: {
    CREATE: "Tạo mới thành công.",
    UPDATE: "Cập nhật thành công.",
    DELETE: "Xóa thành công.",
    SAVE: "Lưu thành công.",
    CONFIRM: "Xác nhận thành công.",
    CANCEL: "Hủy thành công.",
  },

  ERROR: {
    UNKNOWN: "Đã xảy ra lỗi ngoài dự kiến. Vui lòng thử lại.",
    SERVER: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
    NETWORK: "Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.",
    TIMEOUT: "Yêu cầu đã quá thời gian phản hồi.",
    NOT_FOUND: "Không tìm thấy dữ liệu yêu cầu.",
    UNAUTHORIZED: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.",
    FORBIDDEN: "Bạn không có quyền thực hiện thao tác này.",
    VALIDATION: "Vui lòng kiểm tra lại các trường được đánh dấu.",
    CONFLICT: "Dữ liệu đã tồn tại hoặc xảy ra xung đột trạng thái.",
  },

  INFO: {
    NO_DATA: "Không có dữ liệu.",
    LOADING: "Đang tải dữ liệu...",
    PROCESSING: "Hệ thống đang xử lý...",
  },

  WARNING: {
    UNSAVED_CHANGES: "Bạn có thay đổi chưa được lưu.",
  },
} as const;

export const HTTP_ERROR_MESSAGES: Record<number, string> = {
  400: "Yêu cầu không hợp lệ.",
  401: "Phiên làm việc đã hết hạn hoặc bạn chưa đăng nhập.",
  403: "Bạn không có quyền thực hiện thao tác này.",
  404: "Không tìm thấy tài nguyên yêu cầu.",
  409: "Dữ liệu đã tồn tại hoặc xảy ra xung đột dữ liệu.",
  422: "Dữ liệu gửi lên không hợp lệ.",
  429: "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
  500: "Lỗi máy chủ nội bộ. Vui lòng thử lại sau.",
  502: "Máy chủ tạm thời không thể phản hồi.",
  503: "Dịch vụ tạm thời không khả dụng.",
};

export const CRUD_MESSAGES = {
  CREATE_SUCCESS: "Tạo mới thành công.",
  CREATE_ERROR: "Không thể tạo mới dữ liệu.",
  UPDATE_SUCCESS: "Cập nhật thành công.",
  UPDATE_ERROR: "Không thể cập nhật dữ liệu.",
  DELETE_SUCCESS: "Xóa thành công.",
  DELETE_ERROR: "Không thể xóa dữ liệu.",
  FETCH_ERROR: "Không thể tải dữ liệu.",
} as const;

export const FILE_MESSAGES = {
  UPLOAD_SUCCESS: "Tải tệp lên thành công.",
  UPLOAD_ERROR: "Không thể tải tệp lên.",
  IMPORT_SUCCESS: "Nhập dữ liệu thành công.",
  IMPORT_ERROR: "Không thể nhập dữ liệu.",
  EXPORT_SUCCESS: "Xuất dữ liệu thành công.",
  EXPORT_ERROR: "Không thể xuất dữ liệu.",
  INVALID_FILE_TYPE: "Định dạng tệp không hợp lệ.",
  FILE_TOO_LARGE: "Kích thước tệp vượt quá giới hạn cho phép.",
} as const;

export const CONFIRM_MESSAGES = {
  DELETE: {
    TITLE: "Xóa dữ liệu",
    DESCRIPTION: "Bạn có chắc chắn muốn xóa mục này? Thao tác này không thể hoàn tác.",
    CONFIRM: "Xóa",
    CANCEL: "Hủy",
  },
  CANCEL_ACTION: {
    TITLE: "Hủy thao tác",
    DESCRIPTION: "Các thay đổi chưa lưu sẽ bị mất.",
    CONFIRM: "Hủy",
    CANCEL: "Tiếp tục chỉnh sửa",
  },
  RECEIPT: {
    CONFIRM: "Bạn có chắc chắn muốn xác nhận nhập kho phiếu này? Tồn kho sẽ được cập nhật ngay lập tức.",
    CANCEL: "Bạn có chắc chắn muốn hủy phiếu nhập kho này?",
  },
  ISSUE: {
    CONFIRM: "Bạn có chắc chắn muốn xác nhận xuất kho phiếu này? Tồn kho sẽ được trừ theo thuật toán FEFO.",
    CANCEL: "Bạn có chắc chắn muốn hủy phiếu xuất kho này?",
  },
} as const;

export const VALIDATION_MESSAGES = {
  REQUIRED: "Trường này là bắt buộc.",
  PLEASE_CHECK_INPUT: "Vui lòng kiểm tra lại các trường được đánh dấu.",
  EMAIL: {
    REQUIRED: "Email không được để trống.",
    INVALID: "Định dạng email không hợp lệ.",
    MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự.`,
  },
  PASSWORD: {
    REQUIRED: "Mật khẩu không được để trống.",
    MIN_LENGTH: (min: number) => `Mật khẩu phải có tối thiểu ${min} ký tự.`,
    MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự.`,
    FORMAT: "Mật khẩu phải chứa cả chữ cái và chữ số.",
    CONFIRM_REQUIRED: "Vui lòng xác nhận mật khẩu.",
    MISMATCH: "Mật khẩu xác nhận không khớp.",
  },
  NAME: {
    REQUIRED: "Họ và tên không được để trống.",
    MIN_LENGTH: (min: number) => `Họ và tên tối thiểu ${min} ký tự.`,
    MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự.`,
  },
  TEXT: {
    MAX_LENGTH: (max: number) => `Tối đa ${max} ký tự.`,
  },
  NUMBER: {
    REQUIRED: "Vui lòng nhập số.",
    INVALID: "Vui lòng nhập một số hợp lệ.",
    POSITIVE: "Giá trị phải lớn hơn 0.",
    NON_NEGATIVE: "Giá trị không được âm.",
  },
  DATE: {
    REQUIRED: "Vui lòng chọn ngày.",
    INVALID: "Ngày không hợp lệ.",
    MFG_LE_EXP: "Ngày sản xuất phải nhỏ hơn hoặc bằng hạn dùng.",
  },
  ARRAY: {
    MIN_ITEMS: (min: number) => `Cần có ít nhất ${min} mục.`,
  },
} as const;

export const AUTH_MESSAGES = {
  LOGIN: {
    SUCCESS: "Đăng nhập thành công!",
    FAILED: "Email hoặc mật khẩu không chính xác.",
    INVALID_INPUT: "Vui lòng kiểm tra lại thông tin đăng nhập.",
    LOCKED: "Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động.",
    RATE_LIMITED: (seconds: number) =>
      `Quá nhiều lần thử đăng nhập không thành công. Vui lòng thử lại sau ${seconds} giây.`,
    RATE_LIMITED_GENERIC: "Quá nhiều lần thử đăng nhập không thành công. Vui lòng thử lại sau.",
  },
  REGISTER: {
    SUCCESS: "Đăng ký tài khoản thành công!",
    INVALID_INPUT: "Vui lòng kiểm tra lại các trường được đánh dấu.",
    EMAIL_EXISTS: "Email này đã được sử dụng trong hệ thống.",
  },
  LOGOUT: {
    SUCCESS: "Đăng xuất thành công.",
  },
  SESSION: {
    EXPIRED: "Bạn chưa đăng nhập hoặc phiên làm việc đã hết hạn.",
  },
  PERMISSION: {
    DENIED: "Bạn không có quyền thực hiện thao tác này.",
  },
} as const;

export const MEDICINE_MESSAGES = {
  CREATE: {
    SUCCESS: "Đã tạo thuốc.",
    ERROR: "Không thể tạo thuốc mới.",
  },
  UPDATE: {
    SUCCESS: "Đã cập nhật thuốc.",
    ERROR: "Không thể cập nhật thuốc.",
  },
  DELETE: {
    SUCCESS: "Đã xóa thuốc.",
    ERROR: "Không thể xóa thuốc.",
  },
  ERROR: {
    NOT_FOUND: "Không tìm thấy thuốc.",
    CODE_EXISTS: "Mã thuốc đã tồn tại.",
    CANNOT_CHANGE_BASE_UNIT:
      "Không đổi đơn vị cơ sở trong màn hình chỉnh sửa. Hãy cấu hình quy đổi qua quy trình chuyên biệt.",
    INVALID_BASE_UNIT: "Đơn vị cơ sở không hợp lệ.",
    LOAD_FAILED_TITLE: "Không thể tải danh mục thuốc",
    LOAD_FAILED_DESC: "Kiểm tra kết nối Oracle hoặc thử lại sau.",
  },
  VALIDATION: {
    CODE_REQUIRED: "Mã thuốc là bắt buộc.",
    NAME_REQUIRED: "Tên thuốc là bắt buộc.",
    BASE_UNIT_REQUIRED: "Chọn đơn vị cơ sở.",
    MIN_STOCK_NON_NEGATIVE: "Tồn tối thiểu không được âm.",
  },
} as const;

export const INVENTORY_MESSAGES = {
  RECEIPT: {
    CREATE_SUCCESS: "Đã tạo phiếu nhập kho.",
    CONFIRM_SUCCESS: "Đã xác nhận nhập kho thành công.",
    CANCEL_SUCCESS: "Đã hủy phiếu nhập kho.",
    INVALID_INPUT: "Vui lòng kiểm tra lại thông tin phiếu nhập.",
    NOT_FOUND: "Không tìm thấy phiếu nhập kho.",
    WAREHOUSE_NOT_FOUND: "Kho nhận không tồn tại.",
    SUPPLIER_NOT_FOUND: "Nhà cung cấp không tồn tại.",
    MIN_ITEMS: "Phiếu nhập phải có ít nhất 1 mặt hàng.",
    ITEM_QUANTITY_POSITIVE: "Số lượng nhập của từng mặt hàng phải lớn hơn 0.",
    ITEM_QUANTITY_POSITIVE_FIELD: "Số lượng nhập phải lớn hơn 0.",
    UNIT_COST_NON_NEGATIVE: "Đơn giá không được âm.",
    ALREADY_CONFIRMED: "Phiếu nhập kho này đã được xác nhận trước đó.",
    ALREADY_CANCELLED: "Phiếu nhập kho này đã bị hủy, không thể xác nhận.",
    CANNOT_CANCEL: "Phiếu nhập kho này đã ở trạng thái hủy.",
    LOT_MFG_DATE_INVALID: (lotNumber: string) =>
      `Lô ${lotNumber}: Ngày sản xuất không được lớn hơn hạn dùng.`,
    SELECT_WAREHOUSE: "Vui lòng chọn kho nhận.",
    SELECT_SUPPLIER: "Vui lòng chọn nhà cung cấp.",
    SELECT_DATE: "Vui lòng chọn ngày nhập.",
    SELECT_MEDICINE: "Vui lòng chọn thuốc.",
    LOT_NUMBER_REQUIRED: "Số lô không được để trống.",
    EXPIRY_DATE_REQUIRED: "Hạn dùng không được để trống.",
  },
  ISSUE: {
    CREATE_SUCCESS: "Đã tạo phiếu xuất kho.",
    CONFIRM_SUCCESS: "Đã xác nhận xuất kho thành công.",
    CANCEL_SUCCESS: "Đã hủy phiếu xuất kho.",
    INVALID_INPUT: "Vui lòng kiểm tra lại thông tin phiếu xuất.",
    NOT_FOUND: "Không tìm thấy phiếu xuất kho.",
    WAREHOUSE_NOT_FOUND: "Kho xuất không tồn tại.",
    MIN_ITEMS: "Phiếu xuất phải có ít nhất 1 mặt hàng.",
    ITEM_QUANTITY_POSITIVE: "Số lượng xuất của từng mặt hàng phải lớn hơn 0.",
    ITEM_QUANTITY_POSITIVE_FIELD: "Số lượng xuất phải lớn hơn 0.",
    SELECT_WAREHOUSE: "Vui lòng chọn kho xuất.",
    RECEIVER_REQUIRED: "Người nhận / Đơn vị nhận không được để trống.",
    SELECT_DATE: "Vui lòng chọn ngày xuất.",
    SELECT_MEDICINE: "Vui lòng chọn thuốc.",
  },
  FEFO: {
    REQUEST_QUANTITY_POSITIVE: "Số lượng yêu cầu phải lớn hơn 0.",
    REQUEST_QUANTITY_ISSUE_POSITIVE: "Số lượng yêu cầu xuất phải lớn hơn 0.",
    BATCH_NOT_FOUND: (batchId: number | string) =>
      `Không tìm thấy lô thuốc (ID: ${batchId}) trong kho.`,
    BATCH_NOT_AVAILABLE: (lotNumber: string, status: string) =>
      `Lô ${lotNumber} đang ở trạng thái ${status}, không thể xuất kho.`,
    BATCH_EXPIRED: (lotNumber: string, expiryDate: string) =>
      `Lô ${lotNumber} đã hết hạn (${expiryDate}), không thể xuất kho.`,
    BATCH_EXCEEDS_STOCK: (lotNumber: string, requested: number, available: number) =>
      `Số lượng xuất của lô ${lotNumber} (${requested}) vượt quá tồn khả dụng (${available}).`,
    OVERRIDE_REASON_REQUIRED: (lotNumber: string) =>
      `Bắt buộc nhập lý do khi chọn xuất lô không theo thứ tự FEFO (Lô: ${lotNumber}).`,
  },
} as const;

export const ENTITY_MESSAGES = {
  CREATE_SUCCESS: (name: string) => `Đã tạo ${name} thành công.`,
  UPDATE_SUCCESS: (name: string) => `Đã cập nhật ${name} thành công.`,
  DELETE_SUCCESS: (name: string) => `Đã xóa ${name} thành công.`,
  NOT_FOUND: (name: string) => `Không tìm thấy ${name}.`,
} as const;
