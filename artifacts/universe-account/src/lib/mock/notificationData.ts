import { Notification, NotificationCategory, NotificationType, NotificationPriority } from "../types/notification";

let counter = 2000;
function uid() { return `notif-${++counter}`; }

function n(
  userId: string,
  category: NotificationCategory,
  type: NotificationType,
  priority: NotificationPriority,
  title: string,
  body: string,
  minsAgo: number,
  isRead = false,
  actionLabel?: string,
  actionUrl?: string
): Notification {
  return {
    id: uid(),
    userId,
    category,
    type,
    priority,
    title,
    body,
    isRead,
    isDeleted: false,
    actionLabel,
    actionUrl,
    createdAt: new Date(Date.now() - minsAgo * 60000).toISOString(),
    readAt: isRead ? new Date(Date.now() - (minsAgo - 1) * 60000).toISOString() : undefined,
  };
}

export const initialNotifications: Notification[] = [
  // ── Admin notifications ───────────────────────────────────────────────────

  // Security (Bảo mật)
  n("user-admin", "security", "warning", "urgent",
    "Phát Hiện Đăng Nhập Đáng Ngờ",
    "Một lần đăng nhập được thực hiện từ thiết bị không được nhận dạng tại São Paulo, Brazil. Nếu đây không phải bạn, hãy thu hồi quyền truy cập ngay lập tức.",
    2, false, "Xem Thiết Bị", "/devices"),

  n("user-admin", "security", "success", "medium",
    "Xác Thực 2FA Đã Bật",
    "Xác thực hai yếu tố đã được bật thành công trên tài khoản của bạn. Điểm SafePass của bạn đã tăng thêm +8 điểm.",
    480, true),

  n("user-admin", "security", "info", "low",
    "Phiên Đăng Nhập Hết Hạn",
    "Phiên của bạn trên Thiết Bị Di Động đã tự động kết thúc sau 7 ngày không hoạt động.",
    10080, true),

  // System (Hệ thống)
  n("user-admin", "system", "info", "medium",
    "Bảo Trì Nền Tảng Hoàn Tất",
    "Đợt bảo trì theo lịch trình trên cụm Quantum Forge đã hoàn thành. Tất cả các dịch vụ đang hoạt động bình thường.",
    180, true),

  n("user-admin", "system", "announcement", "medium",
    "Hệ Thống Danh Tiếng Mới Ra Mắt",
    "Hệ Thống Danh Tiếng Universe hiện đã ra mắt. Kiểm tra Điểm Tin Cậy, Xếp Hạng Chợ và Cấp Độ Xác Minh của bạn.",
    2880, true, "Xem Danh Tiếng", "/reputation"),

  n("user-admin", "system", "warning", "medium",
    "Giới Hạn Lưu Trữ Sắp Đạt",
    "Tài khoản của bạn đang ở mức 87% dung lượng lưu trữ. Hãy cân nhắc lưu trữ dữ liệu cũ hoặc nâng cấp gói.",
    4320, true),

  // Marketplace (Chợ trực tuyến)
  n("user-admin", "marketplace", "info", "high",
    "Giao Dịch Lớn Đã Hoàn Thành",
    "Việc bán Cosmic Artifact của bạn với giá 98.000 UC đã được xác nhận. Tiền đã được ghi có vào ví của bạn.",
    47, false, "Lịch Sử Giao Dịch", "/reputation"),

  n("user-admin", "marketplace", "warning", "high",
    "Tranh Chấp Giao Dịch Được Mở",
    "VoidRunner đã mở tranh chấp về giao dịch #tr-a008. Người kiểm duyệt sẽ xem xét trong vòng 24 giờ.",
    1440, true, "Xem Tranh Chấp", "/reputation"),

  n("user-admin", "marketplace", "success", "medium",
    "Đề Nghị Mua Nhận Được",
    "Người mua đã đề nghị 2.400 UC cho danh sách Quantum Shard của bạn. Chấp nhận hoặc phản hồi trong vòng 24 giờ.",
    720, false, "Xem Đề Nghị", "/"),

  n("user-admin", "marketplace", "warning", "high",
    "Cảnh Báo Giá Được Kích Hoạt",
    "Nebula Crystal đã giảm xuống dưới ngưỡng cảnh báo 3.000 UC của bạn. Giá hiện tại: 2.870 UC.",
    360, true, "Xem Thị Trường", "/"),

  // Rewards (Phần thưởng)
  n("user-admin", "rewards", "success", "high",
    "Đạt Cấp Độ Kim Cương!",
    "Danh tính của bạn đã được nâng cấp lên bậc Diamond. Bạn hiện có quyền truy cập vào tất cả các tính năng quản trị và chợ cao cấp.",
    15, false, "Xem Danh Tiếng", "/reputation"),

  n("user-admin", "rewards", "success", "medium",
    "Tiến Hóa Hiếm Được Mở Khóa",
    "Stellar Dragon của bạn đã tiến hóa lên Bậc 5 — dạng Vũ Trụ. Tiến hóa này được kích hoạt bởi cột mốc 100+ giao dịch thành công của bạn.",
    240, true, "Xem Sinh Vật", "/"),

  n("user-admin", "rewards", "announcement", "medium",
    "Thưởng Hoàn Thành 30 Ngày",
    "Bạn đã đăng nhập liên tiếp 30 ngày! Phần thưởng đặc biệt: Khung hồ sơ Aurora + 500 XP đã được gửi đến tài khoản của bạn.",
    5760, true, "Nhận Thưởng", "/avatar"),

  n("user-admin", "rewards", "success", "low",
    "Thành Tích Mới Mở Khóa",
    "Bạn đã mở khóa thành tích 'Chúa Tể Vũ Trụ'! +100 điểm thành tích và danh hiệu độc quyền đã được thêm vào hồ sơ của bạn.",
    7200, true, "Xem Thành Tích", "/achievements"),

  // Social (Mạng xã hội)
  n("user-admin", "social", "info", "low",
    "Hồ Sơ Được Chứng Thực",
    "CelestialK đã chứng thực danh tiếng giao dịch của bạn. Số lượt chứng thực hiện tại của bạn là 142.",
    720, true),

  n("user-admin", "social", "success", "medium",
    "Bình Luận Mới Trên Hồ Sơ",
    "QuantumForge đã để lại đánh giá 5 sao trên hồ sơ của bạn: 'Người giao dịch đáng tin cậy nhất tôi từng làm việc cùng!'",
    2160, true),

  n("user-admin", "social", "info", "low",
    "Người Theo Dõi Mới",
    "NebulaDancer, StarSculptor và 8 người dùng khác đã bắt đầu theo dõi hồ sơ của bạn tuần này.",
    4320, true),

  // World Events (Sự kiện thế giới)
  n("user-admin", "world_events", "success", "medium",
    "Xếp Hạng Thế Giới Cập Nhật",
    "Nebula Nexus đã được xếp hạng ⭐⭐⭐⭐⭐ bởi 34 du khách mới trong tuần này. Thế giới của bạn đang thịnh hành trong danh mục Explorer.",
    360, true),

  n("user-admin", "world_events", "warning", "medium",
    "Cảnh Báo Công Suất Thế Giới",
    "Crystal Matrix đang ở 94% công suất. Hãy cân nhắc nâng cấp gói lưu trữ để tránh các vấn đề hiệu suất.",
    5760, true, "Nâng Cấp Thế Giới", "/"),

  n("user-admin", "world_events", "announcement", "medium",
    "Mùa Giải 12 Bắt Đầu",
    "Football Universe Mùa Giải 12 hiện đã ra mắt. Đội của bạn đã được xếp hạt giống ở Hạng 1 dựa trên danh tiếng Diamond của bạn.",
    120, false, "Xem Đội", "/"),

  n("user-admin", "world_events", "success", "low",
    "Cột Mốc Thế Giới: 10.000 Du Khách",
    "Thế giới của bạn đã được ghé thăm 10.000 lần tổng cộng! Một thành tích mới đã được mở khóa: 'Vũ Trụ Riêng'.",
    10080, true, "Xem Thành Tích", "/achievements"),

  // ── Creator notifications ─────────────────────────────────────────────────

  n("user-creator", "marketplace", "success", "high",
    "Tài Sản Bán Thành Công",
    "Art Module của bạn đã bán được 3.200 UC. Thanh toán đã được ghi có vào ví của bạn.",
    30, false, "Xem Giao Dịch", "/reputation"),

  n("user-creator", "security", "warning", "high",
    "Phát Hiện Mật Khẩu Yếu",
    "Mật khẩu hiện tại của bạn đã được tìm thấy trong cơ sở dữ liệu vi phạm đã biết. Hãy cập nhật ngay lập tức.",
    90, false, "Đổi Mật Khẩu", "/security-center"),

  n("user-creator", "social", "info", "medium",
    "Duy Trì Xác Minh Vàng",
    "Xác minh danh tính của bạn đã được gia hạn thêm 90 ngày. Duy trì hoạt động giao dịch để tiến lên Platinum.",
    200, false),

  n("user-creator", "world_events", "success", "medium",
    "Người Theo Dõi Thế Giới Mới",
    "GlowMesh đã bắt đầu theo dõi danh mục World Creator của bạn. Bạn hiện có 38 người theo dõi.",
    310, true),

  n("user-creator", "system", "announcement", "medium",
    "Hệ Thống Thành Tích Ra Mắt",
    "Bạn đã mở khóa 12 thành tích cho đến nay. Xem trang Thành Tích để theo dõi tiến trình của bạn.",
    500, true, "Xem Thành Tích", "/achievements"),

  n("user-creator", "marketplace", "warning", "high",
    "Tranh Chấp Đã Được Nộp",
    "RiftCraft đã nộp tranh chấp về giao dịch #tr-c004. Vui lòng phản hồi trong vòng 48 giờ với bằng chứng.",
    1200, true, "Phản Hồi Tranh Chấp", "/reputation"),

  n("user-creator", "rewards", "success", "low",
    "Cột Mốc Bộ Sưu Tập",
    "Bộ sưu tập của bạn đã đạt 25 sinh vật. Bạn đã mở khóa thành tích Nhà Sưu Tập Đồng.",
    2000, true),

  n("user-creator", "social", "success", "medium",
    "Chứng Thực Mới",
    "SkyNode đã chứng thực đóng góp cộng đồng của bạn. Tổng số lượt chứng thực: 38.",
    3000, true),

  n("user-creator", "world_events", "info", "low",
    "Mùa Chuyển Nhượng Mở Cửa",
    "Mùa Chuyển Nhượng Hè hiện đã mở. Bạn có thể ký hợp đồng tối đa 3 cầu thủ mới trước ngày thi đấu.",
    800, true),

  // ── Regular user notifications ────────────────────────────────────────────

  n("user-regular", "system", "announcement", "high",
    "Chào Mừng Đến Universe!",
    "Tài khoản của bạn đã được thiết lập và sẵn sàng. Hãy bắt đầu bằng cách khám phá Trung Tâm Tài Khoản và hoàn thiện hồ sơ của bạn.",
    60, false, "Trung Tâm Tài Khoản", "/account-center"),

  n("user-regular", "security", "warning", "urgent",
    "Bật 2FA Ngay Bây Giờ",
    "Tài khoản của bạn chưa bật xác thực hai yếu tố. Bật ngay để tăng điểm SafePass và bảo vệ tài khoản.",
    120, false, "Bật 2FA", "/security-center"),

  n("user-regular", "social", "info", "medium",
    "Xác Minh Đồng Đang Hoạt Động",
    "Bạn hiện đang ở cấp xác minh Đồng. Hoàn thành thêm giao dịch để tiến lên Bạc.",
    200, false, "Xem Danh Tiếng", "/reputation"),

  n("user-regular", "marketplace", "success", "medium",
    "Giao Dịch Đầu Tiên Hoàn Thành",
    "Chúc mừng bạn đã hoàn thành giao dịch đầu tiên! Bạn đã kiếm được thành tích 'Giao Dịch Đầu Tiên'.",
    400, true),

  n("user-regular", "rewards", "announcement", "medium",
    "Phần Thưởng Đăng Nhập Hàng Ngày",
    "Chào mừng trở lại! Phần thưởng đăng nhập hàng ngày: +50 XP đã được thêm vào tài khoản của bạn.",
    600, true),

  n("user-regular", "world_events", "info", "low",
    "Chào Mừng Đến Football Universe",
    "Bạn đã được đăng ký cho mùa giải hiện tại. Đội khởi đầu của bạn đang chờ thiết lập chiến thuật.",
    800, true, "Thiết Lập Đội", "/"),
];

// ── Realtime notification pool ─────────────────────────────────────────────

export type LiveNotifTemplate = {
  category: NotificationCategory;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  body: string;
  actionLabel?: string;
};

export const liveNotifPool: LiveNotifTemplate[] = [
  { category: "marketplace", type: "success", priority: "medium", title: "Nhận Được Đề Nghị Mua", body: "Người mua đã đề nghị 2.400 UC cho danh sách Quantum Shard của bạn. Chấp nhận hoặc phản hồi trong vòng 24h.", actionLabel: "Xem Đề Nghị" },
  { category: "security", type: "info", priority: "low", title: "Điểm Bảo Mật Cập Nhật", body: "Điểm SafePass của bạn vừa được tính lại. Kiểm tra Trung Tâm Bảo Mật để xem chi tiết mới nhất." },
  { category: "social", type: "info", priority: "low", title: "Hồ Sơ Được Xem", body: "12 người dùng đã xem hồ sơ danh tiếng của bạn trong 24 giờ qua." },
  { category: "world_events", type: "announcement", priority: "medium", title: "Trận Đấu Sắp Bắt Đầu", body: "Trận Football Universe của bạn bắt đầu sau 15 phút. Xác nhận đội hình xuất phát ngay.", actionLabel: "Chọn Đội Hình" },
  { category: "rewards", type: "success", priority: "low", title: "Phần Thưởng Sẵn Sàng", body: "Phần thưởng hàng tuần của bạn đã sẵn sàng để nhận. Truy cập trang thành tích để nhận ngay.", actionLabel: "Nhận Ngay" },
  { category: "world_events", type: "info", priority: "low", title: "Tăng Đột Biến Hoạt Động Thế Giới", body: "Nebula Nexus nhận được 89 du khách trong giờ qua — kỷ lục mới trong tuần này." },
  { category: "system", type: "warning", priority: "medium", title: "Giới Hạn Lưu Trữ Sắp Đạt", body: "Tài khoản của bạn đang ở 87% dung lượng lưu trữ. Hãy cân nhắc lưu trữ dữ liệu cũ hoặc nâng cấp gói." },
  { category: "marketplace", type: "warning", priority: "high", title: "Cảnh Báo Giá Kích Hoạt", body: "Nebula Crystal giảm xuống dưới ngưỡng cảnh báo 3.000 UC của bạn. Giá hiện tại: 2.870 UC.", actionLabel: "Xem Thị Trường" },
  { category: "social", type: "success", priority: "medium", title: "Chứng Thực Mới!", body: "Một thành viên cộng đồng đã chứng thực danh tiếng chợ của bạn. Tiếp tục phát huy!" },
  { category: "security", type: "warning", priority: "high", title: "Đăng Nhập Thiết Bị Mới", body: "Một thiết bị mới đã đăng nhập vào tài khoản của bạn. Nếu đây không phải bạn, hãy xem xét các phiên đang hoạt động ngay.", actionLabel: "Xem Phiên" },
  { category: "rewards", type: "success", priority: "low", title: "Thành Tích Mở Khóa", body: "Chúc mừng! Thành tích 'Bản Đồ Thiên Hà' đã được mở khóa. Nhận +350 XP và huy hiệu đặc biệt.", actionLabel: "Xem Thành Tích" },
  { category: "world_events", type: "success", priority: "low", title: "Cột Mốc Thế Giới: 1.000 Du Khách", body: "Thế giới của bạn đã được ghé thăm 1.000 lần tổng cộng! Một thành tích mới đã được mở khóa!" },
];
