// =====================================================================
//  VĂN PHÒNG AGENT — FILE CẤU HÌNH DUY NHẤT
//  Thêm phòng mới: chép một khối trong `rooms`, đổi id/tên/vị trí/khu,
//  rồi thêm một dòng vào `links` để nối nó với phòng bên cạnh. Xong.
//  Routine trên cloud cũng đọc file này để biết có những agent nào.
// =====================================================================

export const OFFICE = {
  title: 'Văn phòng agent',
  repo: 'https://github.com/ChuKhibuan/van-phong-agent', // để trang mở được file trong kho

  // ---------------- Nguồn dữ liệu (bảng trạng thái) ----------------
  data: {
    // 'auto'  : có csvUrl thì đọc Google Sheet, không thì chạy dữ liệu mẫu
    // 'sheet' : luôn đọc csvUrl      'mock' : luôn chạy dữ liệu mẫu (demo)
    source: 'auto',
    // Link CSV của tab "Board". Nên dùng dạng gviz (cập nhật nhanh hơn):
    // https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Board
    csvUrl: 'https://docs.google.com/spreadsheets/d/1oiuUuNbyVBbLuhJmtOhiCTnqZyTxu1c0OexZSOs1EWw/gviz/tq?tqx=out:csv&sheet=Board',
    pollSeconds: 7,          // bao lâu đọc lại bảng (giây)
    // (Tuỳ chọn) URL Web App Apps Script để gửi tin/dạy/giao việc vào tab "Inbox"
    inboxUrl: 'https://script.google.com/macros/s/AKfycbxMajiU0rXvP2L_T0PwdaKtR72QO7ufE4nu1iEiZUYoJ1XYmEY_ji9WQ7Gyq8_RTLtF7g/exec',
    inboxKey: 'vpa-74af1392b6a72d086f',          // trùng KEY trong apps-script/Code.gs (chống spam nhẹ)
  },

  // ---------------- Các khu ----------------
  zones: {
    'trung-tam': { name: 'Trung tâm', color: '#f4b8c8' },
    'kinh-doanh': { name: 'Khu Kinh doanh', color: '#f6d58e' },
    'san-xuat': { name: 'Khu Sản xuất', color: '#b9d8f2' },
    'van-hanh': { name: 'Khu Vận hành', color: '#bfe3c0' },
    'kho': { name: 'Kho tri thức', color: '#e3d3b8' },
  },

  // Hai phòng bạn làm việc trực tiếp (hiện nút tắt trên thanh trên cùng)
  contacts: ['bo-nao', 'qa'],

  // ---------------- Các phòng (mỗi phòng = một agent) ----------------
  // x, z    : vị trí tâm phòng (mét). Số âm = phía xa camera.
  // level   : tầng (0 mặt đất, 1 cao nửa tầng, -1 thấp hơn…)
  // w, d    : kích thước phòng
  // layout  : 'brain' | 'reception' | 'desks'
  // staff   : số nhân viên   cat: màu mèo (false = không có mèo)   dog: màu chó (bỏ trống = không có chó)
  // approval: true → việc xong ở trạng thái "Chờ duyệt", người phải duyệt
  // agent   : file subagent .claude/agents/<agent>.md
  rooms: [
    {
      id: 'bo-nao', name: 'Bộ não', zone: 'trung-tam', brain: true, agent: 'bo-nao',
      role: 'Nhận lệnh và bài dạy từ bạn, tóm tắt thành kiến thức (skill), chia việc và kiến thức cho các phòng, kiểm tra kết quả.',
      x: 0, z: 0, level: 1, w: 10, d: 10,
      floor: '#f6cfd9', wall: '#fdf2f5', accent: '#c25b7d',
      layout: 'brain', staff: 3, cat: '#f2b36b', dog: '#d9a066', props: ['rug'],
      suggestions: ['Dạy: bảng giá gói dựng video cưới là…', 'Tóm tắt những gì đã học tuần này', 'Kiểm tra tiến độ tất cả các phòng', 'Có đơn mới, chia việc giúp tôi'],
    },

    // ----- Khu Kinh doanh -----
    {
      id: 'sales', name: 'Bán hàng', zone: 'kinh-doanh', agent: 'sales', approval: true,
      role: 'Trả lời câu hỏi của khách, theo dõi khách chưa chốt và soạn tin nhắc lại, hỗ trợ chốt đơn. Khách hỏi giá thì chuyển phòng Báo giá. Mọi tin gửi khách phải được duyệt.',
      x: -11, z: 0, level: 1, w: 8, d: 8,
      floor: '#f7dc9c', wall: '#fdf7e8', accent: '#b98a2a',
      layout: 'desks', staff: 2, cat: '#8d8f99', props: ['sofa', 'board'],
      suggestions: ['Liệt kê khách chưa chốt quá 3 ngày', 'Soạn tin nhắc lại cho khách…', 'Trả lời khách hỏi về quy trình…'],
    },
    {
      id: 'dang-bai', name: 'Đăng bài', zone: 'kinh-doanh', agent: 'dang-bai',
      role: 'Lên lịch và chuẩn bị đăng video mẫu, bài giới thiệu lên các kênh; theo dõi bài nào kéo được khách.',
      x: -11, z: 11, level: 0, w: 8, d: 8,
      floor: '#f5cf8a', wall: '#fdf6e6', accent: '#c07a2c',
      layout: 'desks', staff: 2, cat: '#e58a4e', dog: '#f1e6d2', props: ['tv', 'beanbags'],
      suggestions: ['Lên lịch đăng tuần tới', 'Viết caption cho video mẫu mới', 'Báo cáo bài nào kéo khách nhất'],
    },

    // ----- Khu Sản xuất -----
    {
      id: 'kich-ban', name: 'Kịch bản & phụ đề', zone: 'san-xuat', agent: 'kich-ban',
      role: 'Viết kịch bản, lời dẫn, tiêu đề hook và file phụ đề cho video.',
      x: -11, z: -11, level: 2, w: 8, d: 8,
      floor: '#c4def5', wall: '#f2f8fd', accent: '#4f7fae',
      layout: 'desks', staff: 2, cat: '#3b3b44', props: ['shelf', 'board'],
      suggestions: ['Viết kịch bản 45 giây cho đơn…', 'Làm phụ đề .srt từ lời thoại', 'Viết 5 tiêu đề hook'],
    },
    {
      id: 'dung', name: 'Dựng', zone: 'san-xuat', agent: 'dung',
      role: 'Dựng video theo kịch bản: cắt ghép, nhạc, hiệu ứng, gắn phụ đề.',
      x: 0, z: -11, level: 2, w: 8, d: 8,
      floor: '#b5d4f0', wall: '#f0f6fc', accent: '#3d6d9c',
      layout: 'desks', staff: 3, cat: '#f5f0e6', props: ['tv'],
      suggestions: ['Dựng bản nháp cho đơn…', 'Xuất bản dọc 1080x1920', 'Thay nhạc nền nhẹ nhàng hơn'],
    },
    {
      id: 'thiet-ke', name: 'Thiết kế', zone: 'san-xuat', agent: 'thiet-ke',
      role: 'Làm thumbnail, ảnh bìa, banner, chữ tiêu đề trên video.',
      x: 11, z: -11, level: 2, w: 8, d: 8,
      floor: '#d3d5f5', wall: '#f5f5fd', accent: '#6a6db8',
      layout: 'desks', staff: 2, cat: '#d9c3a5', props: ['easel', 'shelf'],
      suggestions: ['Làm 3 thumbnail cho video…', 'Thiết kế ảnh bìa bảng giá', 'Đổi font tiêu đề'],
    },
    {
      id: 'qa', name: 'QA · Kiểm duyệt', zone: 'san-xuat', agent: 'qa',
      role: 'Cửa kiểm duyệt của cả công ty: kiểm tra chất lượng mọi việc trước khi giao, gom mọi việc chờ bạn duyệt, và là phòng duy nhất được sửa, đính chính Kho lưu trữ.',
      x: 11, z: 0, level: 1, w: 8, d: 8,
      floor: '#bfe0ea', wall: '#f1f9fb', accent: '#3f8796',
      layout: 'desks', staff: 2, cat: '#8d8f99', props: ['board', 'cooler'],
      gatekeeper: true,
      suggestions: ['Có việc nào đang chờ tôi duyệt?', 'Kiểm tra video đơn…', 'Đính chính trong kho: …', 'Rà lại kho, tìm thông tin cũ hoặc trùng'],
    },

    // ----- Kho tri thức -----
    {
      id: 'luu-tru', name: 'Lưu trữ', zone: 'kho', agent: 'luu-tru', archive: true,
      role: 'Lưu skill, quy trình và hồ sơ công việc của cả công ty. Các phòng gửi tóm tắt sang đây; mọi thay đổi trong kho phải qua QA kiểm duyệt và đính chính.',
      x: 22, z: 0, level: 1, w: 8, d: 8,
      floor: '#ead9bd', wall: '#fbf6ec', accent: '#8a6a3c',
      layout: 'desks', staff: 2, cat: '#d9c3a5', dog: '#b5651d', props: ['shelf', 'shelf', 'shelf', 'rug'],
      suggestions: ['Tìm hồ sơ đơn…', 'Liệt kê các skill công ty đang có', 'Lưu hồ sơ việc vừa xong: …'],
    },

    // ----- Khu Vận hành -----
    {
      id: 'tiep-nhan', name: 'Báo giá', zone: 'van-hanh', agent: 'tiep-nhan', approval: true,
      role: 'Nhận yêu cầu và brief của khách, soạn báo giá (chờ bạn duyệt qua QA), tạo đơn trên Sheet khi khách chốt rồi chuyển Bộ não chia việc.',
      x: 0, z: 11, level: 0, w: 8, d: 8,
      floor: '#c6e6c4', wall: '#f2f9f1', accent: '#4c8a4a',
      layout: 'reception', staff: 2, cat: '#f2b36b', dog: '#5b4636', props: ['sofa', 'cooler'],
      suggestions: ['Soạn báo giá cho khách hỏi gói…', 'Brief này còn thiếu gì để báo giá?', 'Tạo đơn mới (khách đã chốt): …', 'Liệt kê đơn đang mở'],
    },
    {
      id: 'giao-hang', name: 'Giao hàng & CSKH', zone: 'van-hanh', agent: 'giao-hang',
      role: 'Gửi file cho khách, thu phản hồi, xử lý chỉnh sửa, nhắc thanh toán, nhắn tin khi bạn cần (soạn sẵn, bạn duyệt).',
      x: 11, z: 11, level: 0, w: 8, d: 8,
      floor: '#b8e0c8', wall: '#f0f9f3', accent: '#3f8a63',
      layout: 'desks', staff: 2, cat: '#3b3b44', props: ['shelf', 'sofa'],
      suggestions: ['Soạn tin gửi file cho khách…', 'Tổng hợp phản hồi chỉnh sửa', 'Danh sách khách chưa thanh toán'],
    },
    {
      id: 'ctv', name: 'Quản lý CTV', zone: 'van-hanh', agent: 'ctv', approval: true,
      role: 'Quản lý danh sách khách của từng CTV, tính hoa hồng và đề xuất. Trả tiền và ký thoả thuận do người làm.',
      x: 0, z: 22, level: -1, w: 8, d: 8,
      floor: '#d4ebc0', wall: '#f5fbef', accent: '#6c8f3a',
      layout: 'desks', staff: 2, cat: '#e58a4e', props: ['board', 'beanbags'],
      suggestions: ['Tính hoa hồng tháng này', 'Khách nào thuộc CTV nào?', 'Đề xuất mức thưởng cho CTV tốt nhất'],
    },
  ],

  // ---------------- Lối đi nối các phòng ----------------
  // [phòngA, phòngB, kiểu, dời cửa (mét, tuỳ chọn)]
  // kiểu: 'stairs' (cầu thang) | 'escalator' (thang cuốn). Cùng tầng = hành lang phẳng.
  links: [
    ['bo-nao', 'dung', 'escalator'],
    ['bo-nao', 'sales', 'stairs'],
    ['bo-nao', 'qa', 'stairs'],
    ['bo-nao', 'tiep-nhan', 'escalator', -2.2], // dời cửa sang trái để chừa chỗ quầy
    ['kich-ban', 'dung', 'stairs'],
    ['dung', 'thiet-ke', 'stairs'],
    ['kich-ban', 'sales', 'stairs'],
    ['thiet-ke', 'qa', 'stairs'],
    ['qa', 'giao-hang', 'stairs'],
    ['sales', 'dang-bai', 'stairs'],
    ['dang-bai', 'tiep-nhan', 'stairs'],
    ['tiep-nhan', 'giao-hang', 'stairs'],
    ['tiep-nhan', 'ctv', 'stairs'],
    ['qa', 'luu-tru', 'stairs'],
  ],

  // ---------------- Quy trình mẫu ----------------
  // Thứ tự chuyền việc giữa các phòng. Bộ não và các subagent làm theo đây;
  // chế độ demo cũng chạy theo đây. Việc cần bạn duyệt luôn kết thúc ở QA.
  flows: {
    'Đơn dựng video': ['tiep-nhan', 'bo-nao', 'kich-ban', 'dung', 'thiet-ke', 'qa', 'giao-hang', 'luu-tru', 'qa'],
    'Khách hỏi giá': ['bo-nao', 'tiep-nhan', 'qa'],
    'Đăng video mẫu': ['bo-nao', 'kich-ban', 'thiet-ke', 'dang-bai', 'qa'],
    'Tính hoa hồng CTV': ['tiep-nhan', 'ctv', 'qa'],
    'Học kiến thức mới': ['bo-nao', 'luu-tru', 'qa'],
  },
};
