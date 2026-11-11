/* i18n.js — ภาษา: ไทย / English / Tiếng Việt / 한국어
 * วิธีทำงาน: โค้ดเกมเขียนข้อความเป็นภาษาไทย แล้วไฟล์นี้แปลทับตอนแสดงผล (หน้าจอ HTML, แจ้งเตือน, ป้ายในแมพ)
 * ข้อความที่ไม่อยู่ในตารางจะแสดงเป็นภาษาไทยตามเดิม — เพิ่มคำแปลได้ที่ตาราง D ด้านล่าง
 * รูปแบบแถว: [ไทย, English, Tiếng Việt, 한국어]
 *   'x:ข้อความ' = ต้องตรงทั้งข้อความเท่านั้น · 're:รูปแบบ' = regex ($1 = ตัวเลขที่จับได้)
 */
(function () {
  'use strict';
  const LANGS = [['th', 'ไทย'], ['en', 'English'], ['vi', 'Tiếng Việt'], ['ko', '한국어']];
  const D = [
    // ---- โลก / แมพ
    ['หมู่บ้านลำธารไผ่', 'Bamboo Creek Village', 'Làng Suối Tre', '대나무 시냇가 마을'],
    ['ทุ่งไผ่เขียว', 'Green Bamboo Field', 'Cánh đồng Tre Xanh', '푸른 대나무 들판'],
    ['ลำธารไผ่', 'Bamboo Creek', 'Suối Tre', '대나무 시내'],
    ['มอนสเตอร์ในแมพนี้ เลเวล', 'Monsters on this map: Lv', 'Quái vật bản đồ này: Lv', '이 맵의 몬스터 Lv'],
    ['พื้นที่ปลอดภัย · ไม่มีมอนสเตอร์', 'Safe zone · no monsters', 'Khu an toàn · không có quái', '안전지대 · 몬스터 없음'],
    ['พื้นที่ปลอดภัย', 'Safe zone', 'Khu an toàn', '안전지대'],
    ['มอนสเตอร์เลเวล', 'Monsters Lv', 'Quái vật Lv', '몬스터 Lv'],
    ['ประตูวาร์ป ›', 'Warp Gate ›', 'Cổng dịch chuyển ›', '워프 게이트 ›'],
    ['กลับหมู่บ้านลำธารไผ่', 'Back to Bamboo Creek Village', 'Về Làng Suối Tre', '대나무 시냇가 마을로 돌아가기'],
    ['x:ทุ่งไผ่', 'Bamboo Field', 'Cánh đồng Tre', '대나무 들판'],
    ['x:หมู่บ้าน', 'Village', 'Làng', '마을'],
    ['x:กลางวัน', 'Day', 'Ban ngày', '낮'], ['x:กลางคืน', 'Night', 'Ban đêm', '밤'],
    ['re:(\\d)\\s*คน', '$1 players', '$1 người', '$1명'],
    ['เข้ามาในบริเวณนี้', ' entered this area', ' đã vào khu vực này', '님이 이 지역에 들어왔습니다'],
    ['ออกจากบริเวณนี้', ' left this area', ' đã rời khu vực này', '님이 이 지역을 떠났습니다'],
    ['x:ผู้ใหญ่บ้าน', 'Village Chief', 'Trưởng làng', '이장'],
    ['เจ้าของร้านยา', 'Potion Shop Owner', 'Chủ tiệm thuốc', '약국 주인'],
    ['เถ้าแก่โรงเตี๊ยม', 'Innkeeper', 'Chủ quán trọ', '여관 주인'],
    ['ช่างตีเหล็ก', 'Blacksmith', 'Thợ rèn', '대장장이'],
    ['ทหารเฝ้าประตู', 'Gate Guard', 'Lính gác cổng', '문지기'],
    ['x:โรงเตี๊ยม', 'Inn', 'Quán trọ', '여관'], ['x:สำนักยุทธ์', 'Martial Hall', 'Võ đường', '무술 도장'], ['x:เจดีย์ไผ่', 'Bamboo Pagoda', 'Chùa Tre', '대나무 탑'],
    ['x:ร้านยา', 'Potion Shop', 'Tiệm thuốc', '약국'], ['x:ร้านอาวุธและชุดเกราะ', 'Weapons & Armor', 'Vũ khí & Giáp', '무기·방어구점'],
    ['x:วุ้นไผ่', 'Bamboo Jelly', 'Slime Tre', '대나무 젤리'], ['x:หมูป่าไผ่', 'Bamboo Boar', 'Heo rừng Tre', '대나무 멧돼지'],
    // ---- HUD / ปุ่ม
    ['x:สถานะ', 'Status', 'Trạng thái', '스탯'], ['x:สกิล', 'Skills', 'Kỹ năng', '스킬'], ['x:ถุง', 'Bag', 'Túi', '가방'],
    ['x:ถุงของ', 'Bag', 'Túi đồ', '가방'], ['x:ส่ง', 'Send', 'Gửi', '전송'], ['x:ปิด', 'Close', 'Đóng', '닫기'],
    ['ซูมเข้า', 'Zoom in', 'Phóng to', '확대'], ['ซูมออก', 'Zoom out', 'Thu nhỏ', '축소'], ['เวลาในเกม', 'Game time', 'Giờ trong game', '게임 시간'],
    ['จดหมายเควสต์', 'Quest letter', 'Thư nhiệm vụ', '퀘스트 편지'], ['x:จอยสติ๊ก', 'Joystick', 'Cần điều khiển', '조이스틱'],
    ['พิมพ์ข้อความ แล้วกดส่ง…', 'Type a message and press send…', 'Nhập tin nhắn rồi bấm gửi…', '메시지를 입력하고 전송을 누르세요…'],
    ['x:นักเดินทาง', 'Traveler', 'Lữ khách', '여행자'],
    ['x:คาฟร่า · พนักงานบริการ', 'Kafra · Service Staff', 'Kafra · Nhân viên dịch vụ', '카프라 · 서비스 직원'], ['x:พนักงานบริการ', 'Service Staff', 'Nhân viên dịch vụ', '서비스 직원'],
    ['x:คลังเก็บของ', 'Storage', 'Kho đồ', '창고'], ['x:จุดเกิด', 'Save Point', 'Điểm hồi sinh', '저장 위치'], ['x:เดินทาง', 'Travel', 'Di chuyển', '이동'],
    ['คลังยังว่างอยู่', 'Storage is empty', 'Kho còn trống', '창고가 비어 있어요'], ['x:กระเป๋าว่าง', 'Bag is empty', 'Túi trống', '가방이 비어 있어요'],
    ['ในกระเป๋า — ฝากได้', 'In bag — can deposit', 'Trong túi — có thể gửi', '가방 — 맡길 수 있어요'], ['re:^ในคลัง \\((\\d+)/60 ชนิด\\)$', 'In storage ($1/60 types)', 'Trong kho ($1/60 loại)', '창고 ($1/60종)'],
    ['x:ฝาก 1', 'Deposit 1', 'Gửi 1', '맡기기 1'], ['x:ถอน 1', 'Withdraw 1', 'Rút 1', '찾기 1'],
    ['ถ้าตาย จะฟื้นที่เมืองที่บันทึกไว้ค่ะ — ตอนนี้บันทึกไว้ที่ ', 'If you die you revive in your saved town — currently saved at ', 'Nếu chết bạn sẽ hồi sinh ở thị trấn đã lưu — hiện lưu tại ', '죽으면 저장한 마을에서 부활해요 — 현재 저장: '],
    ['บันทึกจุดเกิดที่ ', 'Save respawn point at ', 'Lưu điểm hồi sinh tại ', '저장 위치 지정: '],
    ['ไปเมืองที่เคยไปแล้ว ค่าบริการ ', 'Go to a town you have visited. Fee: ', 'Đến thị trấn đã từng ghé. Phí: ', '가 본 마을로 이동. 요금: '],
    ['x:ยังไม่มีเมืองอื่นที่เคยไป', 'No other visited towns yet', 'Chưa có thị trấn nào khác', '아직 가 본 다른 마을이 없어요'],
    ['เดินเข้าไปใกล้คาฟร่าก่อนนะ', 'Walk up to Kafra first', 'Hãy đến gần Kafra trước nhé', '카프라 가까이 가 주세요'],
    ['คลังเต็มแล้ว (สูงสุด ', 'Storage full (max ', 'Kho đầy (tối đa ', '창고가 가득 찼어요 (최대 '],
    ['ยินดีให้บริการค่ะ ฝากของ บันทึกจุดเกิด หรือเดินทางด่วน ถามคาฟร่าได้เลยนะคะ', 'At your service! Storage, save point, or fast travel — just ask Kafra.', 'Rất hân hạnh! Gửi đồ, lưu điểm hồi sinh hay di chuyển nhanh — cứ hỏi Kafra nhé.', '어서 오세요! 보관, 저장, 빠른 이동 모두 카프라에게 맡겨 주세요.'],
    ['ของล้นถุงแล้วหรือคะ? ฝากไว้กับคาฟร่าได้ค่ะ', 'Bag overflowing? Leave your things with Kafra.', 'Túi đầy rồi sao? Gửi Kafra giữ giúp nhé.', '가방이 가득 찼나요? 카프라에게 맡기세요.'],
    ['x:โจมตีปกติ', 'Basic Attack', 'Đánh thường', '기본 공격'], ['พื้นฐาน · วิ่งไปตีมอนสเตอร์ที่ใกล้ที่สุด', 'Basic · runs to and hits the nearest monster', 'Cơ bản · chạy tới đánh quái gần nhất', '기본 · 가장 가까운 몬스터에게 달려가 공격'],
    ['x:ใช้', 'Use', 'Dùng', '사용'], ['x:ลงคีย์ลัด', 'To hotbar', 'Gán phím tắt', '단축키 등록'],
    ['ไม่มีมอนสเตอร์ในแมพนี้ตอนนี้', 'No monsters on this map right now', 'Hiện không có quái trên bản đồ này', '지금 이 맵에는 몬스터가 없어요'],
    ['x:เลือกตัวละคร', 'Choose Character', 'Chọn nhân vật', '캐릭터 선택'], ['x:ออกจากเกม', 'Quit Game', 'Thoát game', '게임 종료'],
    ['x:กลับไปเล่นต่อ', 'Back to the game', 'Quay lại chơi', '게임으로 돌아가기'], ['x:จะไปแล้วจริงๆหรอ', 'Are you really leaving?', 'Bạn thật sự đi sao?', '정말 가실 건가요?'],
    ['x:ใช่', 'Yes', 'Vâng', '네'], ['x:ยังแค่กดผิด', 'No, just a mis-tap', 'Chưa, bấm nhầm thôi', '아니요, 잘못 눌렀어요'],
    ['x:แล้วเจอกันใหม่นะ 👋', 'See you again 👋', 'Hẹn gặp lại 👋', '또 만나요 👋'], ['x:ปิดหน้านี้ได้เลย', 'You can close this page now', 'Bạn có thể đóng trang này', '이 페이지를 닫아도 돼요'],
    ['x:กลับเข้าเกม', 'Back to game', 'Vào lại game', '게임으로 다시 들어가기'], ['x:ซ่อนแชท', 'Hide chat', 'Ẩn chat', '채팅 숨기기'], ['x:แสดงแชท', 'Show chat', 'Hiện chat', '채팅 보기'],
    ['x:เมนู', 'Menu', 'Menu', '메뉴'],

    ['x:ตั้งค่าออโต้', 'Auto Settings', 'Cài đặt Auto', '오토 설정'], ['x:กดยาเลือดเอง', 'Auto HP potion', 'Tự dùng thuốc HP', 'HP 물약 자동 사용'], ['เมื่อเลือดต่ำกว่า (ใช้สกิลฟื้นฟูก่อนถ้ามี)', 'When HP is below (uses a heal skill first if any)', 'Khi HP dưới (ưu tiên kỹ năng hồi phục)', 'HP가 이 값 미만일 때 (회복 스킬 우선)'],
    ['x:กดยา MP เอง', 'Auto MP potion', 'Tự dùng thuốc MP', 'MP 물약 자동 사용'], ['x:เมื่อ MP ต่ำกว่า', 'When MP is below', 'Khi MP dưới', 'MP가 이 값 미만일 때'],
    ['x:ปล่อยสกิลโจมตีเอง', 'Auto attack skills', 'Tự dùng kỹ năng tấn công', '공격 스킬 자동 사용'], ['ใช้สกิลที่เรียนแล้วเมื่อพร้อม (เลือกสกิลด้านล่าง)', 'Uses learned skills when ready (pick skills below)', 'Dùng kỹ năng đã học khi sẵn sàng (chọn bên dưới)', '배운 스킬을 준비되면 사용 (아래에서 선택)'],
    ['x:ใช้บัฟเอง', 'Auto buffs', 'Tự dùng buff', '버프 자동 사용'], ['x:ต่อบัฟอัตโนมัติเมื่อหมดเวลา', 'Re-applies buffs when they expire', 'Tự gia hạn buff khi hết', '버프가 끝나면 자동 갱신'],
    ['x:หยุดออโต้ถ้าเลือดต่ำและยาหมด', 'Stop if HP low and out of potions', 'Dừng nếu HP thấp và hết thuốc', 'HP 낮고 물약 없으면 정지'], ['x:เมื่อเลือดต่ำกว่า', 'When HP is below', 'Khi HP dưới', 'HP가 이 값 미만일 때'],
    ['x:ระยะหามอนสเตอร์', 'Monster search range', 'Phạm vi tìm quái', '몬스터 탐색 범위'], ['x:ไกลสุดจากตัวละคร', 'Max distance from you', 'Xa nhất từ nhân vật', '캐릭터로부터 최대 거리'], ['re:^(\\d+) ช่อง$', '$1 tiles', '$1 ô', '$1칸'],
    ['x:เปิดอยู่', 'On', 'Bật', '켜짐'], ['x:ปิดอยู่', 'Off', 'Tắt', '꺼짐'],
    ['x:สกิลที่ให้ใช้ (แตะเพื่อเปิด/ปิด)', 'Skills to use (tap to toggle)', 'Kỹ năng được dùng (chạm để bật/tắt)', '사용할 스킬 (눌러서 켜기/끄기)'],
    ['x:ยังไม่มีสกิลที่เรียน — ออโต้จะตีธรรมดา (โจมตีปกติ)', 'No learned skills — auto will use the basic attack', 'Chưa có kỹ năng — Auto sẽ đánh thường', '배운 스킬이 없어요 — 기본 공격만 사용'],
    ['x:หยุดออโต้', 'Stop Auto', 'Dừng Auto', '오토 정지'], ['x:เริ่มออโต้', 'Start Auto', 'Bắt đầu Auto', '오토 시작'],
    ['ออโต้: เริ่ม — ตีมอน/ปล่อยสกิล/กดยาให้เอง (แตะอีกครั้งเพื่อหยุด)', 'Auto: ON — fights, casts skills and drinks potions (tap again to stop)', 'Auto: BẬT — tự đánh, dùng kỹ năng và thuốc (chạm lần nữa để dừng)', '오토: 시작 — 전투·스킬·물약을 자동으로 (다시 누르면 정지)'],
    ['ออโต้: หยุด', 'Auto: OFF', 'Auto: TẮT', '오토: 정지'], ['ออโต้ใช้ในแมพล่ามอนสเตอร์ — ออกจากเมืองก่อนนะ', 'Auto works on hunting maps — leave town first', 'Auto dùng ở bản đồ săn quái — hãy ra khỏi thị trấn', '오토는 사냥터에서 사용해요 — 마을 밖으로 나가세요'],
    [' · ตัวละครพ่ายแพ้', ' · you were defeated', ' · bạn đã bại trận', ' · 쓰러졌어요'], [' · เลือดต่ำและไม่มียา', ' · low HP and no potions', ' · HP thấp và hết thuốc', ' · HP 낮고 물약 없음'],
    [' · คุณสั่งเดินเอง', ' · you moved manually', ' · bạn tự di chuyển', ' · 직접 이동함'], [' · ไปคุยกับ NPC', ' · going to an NPC', ' · đi gặp NPC', ' · NPC에게 이동'], [' · เดินทางข้ามแมพ', ' · traveling between maps', ' · di chuyển giữa các bản đồ', ' · 맵 이동 중'],
    ['x:เควสต์', 'Quests', 'Nhiệm vụ', '퀘스트'], ['x:ภารกิจหลัก', 'Main Quests', 'Nhiệm vụ chính', '메인 퀘스트'], ['x:ภารกิจรอง', 'Side Quests', 'Nhiệm vụ phụ', '서브 퀘스트'], ['x:เลื่อนคลาส', 'Class Change', 'Chuyển chức', '전직'],
    ['re:^ภารกิจหลัก \\((\\d+)\\)$', 'Main Quests ($1)', 'Nhiệm vụ chính ($1)', '메인 퀘스트 ($1)'], ['re:^ภารกิจรอง \\((\\d+)\\)$', 'Side Quests ($1)', 'Nhiệm vụ phụ ($1)', '서브 퀘스트 ($1)'], ['re:^เลื่อนคลาส \\((\\d+)\\)$', 'Class Change ($1)', 'Chuyển chức ($1)', '전직 ($1)'],
    ['re:^ภารกิจทั้งหมด \\((\\d+)\\)$', 'All Quests ($1)', 'Tất cả nhiệm vụ ($1)', '전체 퀘스트 ($1)'], ['re:^ทำเสร็จแล้ว \\((\\d+)\\)$', 'Completed ($1)', 'Đã xong ($1)', '완료 ($1)'],
    ['re:^กล่องจดหมาย \\((\\d+)\\)$', 'Mailbox ($1)', 'Hộp thư ($1)', '우편함 ($1)'],
    ['x:จดหมาย', 'Mail', 'Thư', '우편'], ['x:กล่องจดหมาย', 'Mailbox', 'Hộp thư', '우편함'], ['x:เสร็จแล้ว', 'Done', 'Xong', '완료'],
    ['x:รับของ', 'Claim items', 'Nhận đồ', '아이템 받기'], ['x:ลบจดหมาย', 'Delete mail', 'Xóa thư', '우편 삭제'], ['x:เปิดเมนูเควสต์', 'Open quest menu', 'Mở menu nhiệm vụ', '퀘스트 메뉴 열기'],
    ['จดหมายนกพิราบ · เควสต์ใหม่', 'Pigeon Mail · New Quests', 'Thư bồ câu · Nhiệm vụ mới', '비둘기 편지 · 새 퀘스트'],
    ['ไม่มีเควสต์ใหม่ — เควสต์ที่รับแล้วดูได้ที่ Start › เควสต์', 'No new quests — accepted quests are under Start › Quests', 'Không có nhiệm vụ mới — nhiệm vụ đã nhận nằm ở Start › Nhiệm vụ', '새 퀘스트가 없어요 — 수락한 퀘스트는 Start › 퀘스트에서 볼 수 있어요'],
    ['x:ยังไม่มีภารกิจในหมวดนี้', 'No quests in this group yet', 'Chưa có nhiệm vụ trong nhóm này', '이 분류에 퀘스트가 없어요'], ['x:ยังไม่มีที่ทำเสร็จ', 'Nothing completed yet', 'Chưa hoàn thành cái nào', '완료한 퀘스트가 없어요'],
    ['รางวัลที่ได้รับ: EXP ', 'Rewards received: EXP ', 'Phần thưởng đã nhận: EXP ', '받은 보상: EXP '], [' — ครบแล้ว ไปส่งที่ ', ' — complete! Turn it in at ', ' — đã đủ! Trả tại ', ' — 완료! 제출할 곳: '],
    ['re:^ไปหา (.+) ›$', 'Go to $1 ›', 'Đến gặp $1 ›', '$1에게 가기 ›'],
    ['ยังไม่มีจดหมาย — เปลี่ยนอาชีพแล้วจะมีชุดเริ่มต้นส่งมา', 'No mail yet — you will get a starter kit when you change jobs', 'Chưa có thư — đổi nghề sẽ nhận bộ đồ khởi đầu', '우편이 없어요 — 전직하면 시작 장비가 도착해요'],
    ['x:สมาคมอาชีพ', 'Job Guild', 'Hội nghề nghiệp', '직업 길드'], ['ชุดเริ่มต้นของ ', 'Starter kit: ', 'Bộ đồ khởi đầu: ', '시작 장비: '], ['x:จาก สมาคมอาชีพ', 'From Job Guild', 'Từ Hội nghề nghiệp', '보낸 이: 직업 길드'],
    ['ยินดีด้วยที่ได้เป็น ', 'Congratulations on becoming ', 'Chúc mừng bạn đã trở thành ', '축하해요! 당신은 이제 '],
    ['! สมาคมส่งอุปกรณ์เริ่มต้นประจำอาชีพมาให้ รับของแล้วเปิดถุงเพื่อสวมใส่ได้เลย', '! The guild sent your starter gear. Claim it, then open your bag to equip it.', '! Hội gửi bộ đồ khởi đầu cho bạn. Nhận xong hãy mở túi để mặc.', '! 길드가 시작 장비를 보냈어요. 받은 뒤 가방에서 장착하세요.'],
    ['มีจดหมายใหม่: ', 'New mail: ', 'Thư mới: ', '새 우편: '], ['รับของจากจดหมายแล้ว', 'Items claimed from mail', 'Đã nhận đồ từ thư', '우편 아이템을 받았어요'], ['รับของในจดหมายก่อนนะ', 'Claim the items in this mail first', 'Hãy nhận đồ trong thư trước nhé', '먼저 우편의 아이템을 받아 주세요'],
    ['x:เอาออกจากคีย์ลัดแล้ว', 'Removed from hotbar', 'Đã bỏ khỏi phím tắt', '단축키에서 뺐어요'],
    ['แตะช่องใหม่เพื่อย้าย · แตะที่อื่นเพื่อเอาออกจากคีย์ลัด', 'Tap another slot to move · tap elsewhere to remove from hotbar', 'Chạm ô khác để di chuyển · chạm chỗ khác để bỏ khỏi phím tắt', '다른 칸을 눌러 이동 · 다른 곳을 누르면 단축키에서 제거'],
    ['ย่อ/ขยายแถบคีย์ลัด', 'Resize hotbar', 'Thu/phóng thanh phím tắt', '단축키 바 크기 조절'],
    ['กำลังเชื่อมต่อ…', 'Connecting…', 'Đang kết nối…', '연결 중…'],
    ['เคล็ดลับ: กดค้างที่กรอบสถานะ (HP/MP/EXP) แล้วลากเพื่อย้ายตำแหน่งได้', 'Tip: hold the status frame (HP/MP/EXP) and drag to move it', 'Mẹo: giữ khung trạng thái (HP/MP/EXP) rồi kéo để di chuyển', '팁: 상태창(HP/MP/EXP)을 길게 눌러 끌면 위치를 옮길 수 있어요'],
    ['ลากจอยสติ๊กมุมขวาล่างหรือแตะพื้นเพื่อเดิน · เดินผ่านประตูวาร์ปทางเหนือเพื่อไปล่ามอนสเตอร์ที่ทุ่งไผ่เขียว · แตะเจ้าของร้านเพื่อซื้อ/ขายของ', 'Drag the joystick (bottom right) or tap the ground to walk · take the north warp gate to hunt in Green Bamboo Field · tap a shop owner to buy/sell', 'Kéo cần điều khiển (góc phải dưới) hoặc chạm đất để đi · qua cổng dịch chuyển phía bắc để săn quái ở Cánh đồng Tre Xanh · chạm chủ tiệm để mua/bán', '오른쪽 아래 조이스틱을 끌거나 바닥을 눌러 이동 · 북쪽 워프 게이트로 푸른 대나무 들판에서 사냥 · 상점 주인을 눌러 사고팔기'],
    ['คุณพ่ายแพ้… จะฟื้นคืนชีพที่ลานหมู่บ้านใน 4 วินาที', 'You were defeated… respawning at the village square in 4 seconds', 'Bạn đã bại trận… hồi sinh ở quảng trường làng sau 4 giây', '쓰러졌습니다… 4초 후 마을 광장에서 부활합니다'],
    ['เลเวลขึ้นเป็น', 'Level up! Now Lv', 'Lên cấp! Hiện là Lv', '레벨 업! 현재 Lv'],
    ['x:ได้รับ', 'Received', 'Nhận được', '획득'],
    ['มีเควสต์ใหม่! ดูที่นกพิราบ', 'New quest! Check the pigeon', 'Có nhiệm vụ mới! Xem chim bồ câu', '새 퀘스트! 비둘기를 확인하세요'],
    ['เควสต์ใหม่:', 'New quest:', 'Nhiệm vụ mới:', '새 퀘스트:'],
    ['เควสต์สำเร็จ!', 'Quest complete!', 'Hoàn thành nhiệm vụ!', '퀘스트 완료!'],
    ['เควสต์สำเร็จ:', 'Quest complete:', 'Hoàn thành nhiệm vụ:', '퀘스트 완료:'],
    ['เกิดใหม่!', 'Reborn!', 'Tái sinh!', '환생!'], ['คลาส 4!', 'Class 4!', 'Lớp 4!', '4차 직업!'],
    ['เกิดใหม่ครั้งที่', 'Rebirth #', 'Tái sinh lần', '환생 횟수'],
    ['เลื่อนเป็นคลาส 4 ของ', 'advanced to Class 4:', 'lên Lớp 4:', '4차 전직:'],
    ['เลื่อนอาชีพเป็น', 'changed job to', 'đã đổi nghề thành', '전직:'],
    ['เข้าสู่ระบบไม่สำเร็จ กรุณาล็อกอินใหม่', 'Sign-in failed, please log in again', 'Đăng nhập thất bại, vui lòng đăng nhập lại', '로그인 실패, 다시 로그인해 주세요'],
    ['เซิร์ฟเวอร์เต็มแล้ว ลองใหม่ภายหลังนะ', 'Server is full, try again later', 'Máy chủ đã đầy, hãy thử lại sau', '서버가 가득 찼습니다. 나중에 다시 시도하세요'],
    ['เปิดจากไฟล์ตรง ๆ จึงเข้าโหมดเดโม · รัน node online-server.js เพื่อเล่นออนไลน์จริง', 'Opened as a local file, so demo mode is on · run node online-server.js to play online', 'Mở trực tiếp từ tệp nên vào chế độ demo · chạy node online-server.js để chơi online', '파일로 직접 열어 데모 모드로 실행됩니다 · 온라인 플레이는 node online-server.js 실행'],
    ['ต่อเซิร์ฟเวอร์ไม่ได้ จึงเข้าโหมดเดโมแทน (ความคืบหน้าจะไม่ถูกบันทึก)', 'Cannot reach the server, using demo mode (progress will not be saved)', 'Không kết nối được máy chủ, dùng chế độ demo (tiến trình sẽ không được lưu)', '서버에 연결할 수 없어 데모 모드로 실행합니다 (진행 상황 저장 안 됨)'],
    ['มีการเข้าสู่ระบบจากที่อื่น · แตะเพื่อเข้าใหม่', 'Signed in from elsewhere · tap to re-enter', 'Đăng nhập từ nơi khác · chạm để vào lại', '다른 곳에서 로그인됨 · 눌러서 다시 접속'],
    ['หลุดการเชื่อมต่อ · แตะเพื่อเข้าใหม่', 'Disconnected · tap to re-enter', 'Mất kết nối · chạm để vào lại', '연결 끊김 · 눌러서 다시 접속'],
    ['เชื่อมต่อเซิร์ฟเวอร์เดียวกับหน้านี้ — ทุกคนที่เล่นอยู่จะเห็นกัน', 'Connected to this page’s server — everyone playing can see each other', 'Đã kết nối máy chủ của trang này — mọi người đang chơi sẽ thấy nhau', '이 페이지의 서버에 연결됨 — 접속한 모두가 서로 보입니다'],
    ['โหมดเดโม —', 'Demo mode —', 'Chế độ demo —', '데모 모드 —'],
    ['ล็อกอินผ่าน Firebase แต่ตัวละคร', 'Signed in via Firebase but characters', 'Đăng nhập qua Firebase nhưng nhân vật', 'Firebase로 로그인했지만 캐릭터'],
    ['บัญชีและความคืบหน้า', 'Accounts and progress', 'Tài khoản và tiến trình', '계정과 진행 상황'],
    ['เก็บในเครื่องนี้ · คนอื่นในหมู่บ้านเป็นบอทจำลอง · ออนไลน์จริงต้องรัน node online-server.js', 'are stored on this device · other villagers are simulated bots · run node online-server.js for real online play', 'được lưu trên thiết bị này · người khác trong làng là bot mô phỏng · muốn chơi online thật hãy chạy node online-server.js', '이 기기에 저장됩니다 · 마을의 다른 사람은 가상의 봇입니다 · 실제 온라인은 node online-server.js 실행'],
    // ---- กระเป๋า / ไอเท็ม
    ['กระเป๋า ·', 'Bag ·', 'Túi ·', '가방 ·'],
    ['x:เหรียญ', 'Coins', 'Xu', '코인'], ['เหรียญ)', 'coins)', 'xu)', '코인)'], ['เหรียญ', 'coins', 'xu', '코인'],
    ['· ป้องกัน', '· DEF', '· Phòng thủ', '· 방어'], ['x:โจมตี', 'ATK', 'Tấn công', '공격'],
    ['โจมตี +', 'ATK +', 'Tấn công +', '공격 +'], ['เวท +', 'MATK +', 'Phép +', '마법 +'], ['ป้องกัน +', 'DEF +', 'Phòng thủ +', '방어 +'],
    ['ฟื้นเลือด', 'Restores HP', 'Hồi máu', 'HP 회복'],
    ['· แตะ 2 ครั้งที่อุปกรณ์เพื่อสวมใส่/ถอด', '· Tap equipment twice to equip/unequip', '· Chạm 2 lần vào trang bị để mặc/tháo', '· 장비를 두 번 누르면 착용/해제'],
    ['x:อาวุธ', 'Weapon', 'Vũ khí', '무기'], ['x:มืออีกข้าง', 'Off-hand', 'Tay phụ', '보조손'], ['x:เกราะ', 'Armor', 'Giáp', '방어구'], ['x:กระสุน', 'Ammo', 'Đạn', '탄약'],
    ['แตะอีกครั้งเพื่อถอด', 'Tap again to unequip', 'Chạm lần nữa để tháo', '다시 누르면 해제'],
    ['ยังใส่ไม่ได้:', 'Cannot equip yet:', 'Chưa thể mặc:', '아직 착용 불가:'],
    ['แตะอีกครั้งเพื่อใส่/ถอดในช่องกระสุน', 'Tap again to equip/unequip in the ammo slot', 'Chạm lần nữa để mặc/tháo ở ô đạn', '다시 누르면 탄약칸에 착용/해제'],
    ['แตะอีกครั้งเพื่อสวมใส่', 'Tap again to equip', 'Chạm lần nữa để mặc', '다시 누르면 착용'],
    ['แตะอีกครั้งเพื่อยกไปวางที่ช่องคีย์ลัด', 'Tap again to pick it up and place it on the hotbar', 'Chạm lần nữa để nhấc lên và đặt vào phím tắt', '다시 누르면 들어서 단축키에 놓을 수 있어요'],
    ['ไอเท็มสำหรับขายหรือส่งเควสต์', 'Item for selling or quests', 'Vật phẩm để bán hoặc nộp nhiệm vụ', '판매 또는 퀘스트용 아이템'],
    ['ราคารับซื้อ', 'Sell price', 'Giá thu mua', '판매가'],
    ['แตะไอเท็ม 1 ครั้งเพื่อดูรายละเอียด', 'Tap an item once to see details', 'Chạm vật phẩm 1 lần để xem chi tiết', '아이템을 한 번 누르면 상세 정보'],
    ['ไอเท็มนี้ใช้งานไม่ได้ · เอาไปขายหรือส่งเควสต์', 'This item cannot be used · sell it or hand it in for a quest', 'Không thể dùng vật phẩm này · mang đi bán hoặc nộp nhiệm vụ', '사용할 수 없는 아이템 · 판매하거나 퀘스트에 제출하세요'],
    ['แตะช่องคีย์ลัดเพื่อวางไอเท็ม (แตะที่อื่นเพื่อยกเลิก)', 'Tap a hotbar slot to place it (tap elsewhere to cancel)', 'Chạm ô phím tắt để đặt (chạm chỗ khác để hủy)', '단축키 칸을 눌러 놓으세요 (다른 곳을 누르면 취소)'],
    ['x:ไม่มี', 'None', 'Không có', '없음'], ['x:แล้ว', 'done', 'xong', '완료'],
    ['เลือดเต็มอยู่แล้ว', 'HP is already full', 'Máu đã đầy', 'HP가 이미 가득합니다'],
    ['ยังไม่ได้เรียนสกิล', 'You have not learned this skill yet', 'Bạn chưa học kỹ năng này', '아직 배우지 않은 스킬입니다'],
    ['ช่องนี้ยังว่างอยู่', 'This slot is empty', 'Ô này còn trống', '이 칸은 비어 있습니다'],
    ['เป็นสกิลติดตัว ไม่ต้องกดใช้', 'Passive skill, no need to activate', 'Kỹ năng bị động, không cần bấm dùng', '패시브 스킬이라 사용할 필요가 없어요'],
    ['MP ไม่พอ (ต้องใช้', 'Not enough MP (needs', 'Không đủ MP (cần', 'MP 부족 (필요'],
    ['MP ไม่พอ', 'Not enough MP', 'Không đủ MP', 'MP 부족'],
    ['ในหมู่บ้านไม่มีมอนสเตอร์ — ไปทุ่งไผ่เขียวก่อนนะ', 'No monsters in the village — head to Green Bamboo Field first', 'Trong làng không có quái — hãy đến Cánh đồng Tre Xanh trước', '마을에는 몬스터가 없어요 — 먼저 푸른 대나무 들판으로 가세요'],
    ['เหรียญทองแดง', 'Copper Coin', 'Xu đồng', '구리 동전'], ['เงินที่ใช้กันทั่วทั้งลำธารไผ่', 'Currency used throughout Bamboo Creek', 'Tiền tệ dùng khắp Suối Tre', '대나무 시내 전역에서 쓰이는 화폐'],
    ['ก้อนวุ้นไผ่', 'Bamboo Jelly Lump', 'Cục slime tre', '대나무 젤리 덩어리'], ['วุ้นเหนียวหนึบจากสไลม์ไผ่ พ่อค้ารับซื้อไปทำขนม', 'Sticky jelly from bamboo slimes; merchants buy it for sweets', 'Thạch dẻo từ slime tre, thương nhân mua để làm bánh', '대나무 슬라임의 끈적한 젤리. 상인이 과자 재료로 사 갑니다'],
    ['เขี้ยวหมูป่า', 'Boar Tusk', 'Nanh heo rừng', '멧돼지 어금니'], ['เขี้ยวโค้งคมกริบของหมูป่าไผ่ ช่างตีเหล็กชอบนัก', 'A sharp curved tusk of a bamboo boar; blacksmiths love it', 'Chiếc nanh cong sắc bén của heo rừng tre, thợ rèn rất thích', '대나무 멧돼지의 날카로운 어금니. 대장장이가 좋아합니다'],
    ['x:สมุนไพร', 'Herb', 'Thảo dược', '약초'], ['ใบไม้สดชื่นที่เคี้ยวแล้วแผลหายไว ฟื้นเลือด 40', 'Fresh leaves that heal wounds when chewed. Restores 40 HP', 'Lá tươi nhai vào lành vết thương nhanh. Hồi 40 máu', '씹으면 상처가 빨리 낫는 신선한 잎. HP 40 회복'],
    ['x:ยาบำรุงกำลัง', 'Vigor Tonic', 'Thuốc bổ sức', '활력 보약'], ['ยาต้มสูตรลับของร้านยา ฟื้นเลือด 100', 'The potion shop’s secret brew. Restores 100 HP', 'Thuốc sắc bí truyền của tiệm thuốc. Hồi 100 máu', '약국의 비법 달임약. HP 100 회복'],
    ['x:ดาบไม้ไผ่', 'Bamboo Sword', 'Kiếm tre', '대나무 검'], ['ดาบฝึกหัดเหลาจากไผ่แก่ เบาและทนกว่าที่คิด', 'A training sword carved from old bamboo, lighter and tougher than it looks', 'Kiếm tập làm từ tre già, nhẹ và bền hơn tưởng', '오래된 대나무로 깎은 연습용 검. 가볍고 생각보다 튼튼합니다'],
    ['x:ดาบเหล็กกล้า', 'Steel Sword', 'Kiếm thép', '강철 검'], ['ดาบเหล็กพับสามชั้น คมกริบ', 'A triple-folded steel blade, razor sharp', 'Kiếm thép gập ba lớp, cực sắc', '세 번 접어 두드린 강철 검. 매우 날카롭습니다'],
    ['เสื้อคลุมผ้าฝ้าย', 'Cotton Robe', 'Áo choàng vải bông', '면 로브'], ['เสื้อคลุมเนื้อหนา กันลมกันหนาวได้ดี', 'A thick robe that keeps out wind and cold', 'Áo choàng dày, chắn gió chắn lạnh tốt', '두툼해서 바람과 추위를 잘 막아 줍니다'],
    ['เกราะหนังหมูป่า', 'Boar Hide Armor', 'Giáp da heo rừng', '멧돼지 가죽 갑옷'], ['เกราะหนังแข็งเย็บมือ กันเขี้ยวหมูป่าได้สบาย', 'Hand-stitched hard leather that shrugs off boar tusks', 'Giáp da cứng khâu tay, chống nanh heo rừng thoải mái', '손으로 꿰맨 단단한 가죽. 멧돼지 어금니도 막아 냅니다'],
    ['เสื้อคลุม', 'Robe', 'Áo choàng', '로브'], ['เกราะหนัง', 'Leather Armor', 'Giáp da', '가죽 갑옷'], ['เกราะเหล็ก', 'Iron Armor', 'Giáp sắt', '철 갑옷'],
    ['ลูกธนูไม้', 'Wooden Arrow', 'Tên gỗ', '나무 화살'], ['ลูกธนูพื้นฐาน ยิงแล้วหมดไป ต้องซื้อเติม', 'Basic arrows. Used up when fired; buy more', 'Tên cơ bản. Bắn là mất, cần mua thêm', '기본 화살. 쏘면 사라지니 다시 사야 합니다'],
    ['ลูกธนูเหล็ก', 'Iron Arrow', 'Tên sắt', '철 화살'], ['ปลายเหล็ก แรงกว่าธนูไม้ ยิงแล้วหมดไป', 'Iron-tipped, stronger than wooden arrows. Used up when fired', 'Đầu sắt, mạnh hơn tên gỗ. Bắn là mất', '철 촉으로 나무 화살보다 강합니다. 쏘면 사라집니다'],
    ['กระสุนตะกั่ว', 'Lead Bullet', 'Đạn chì', '납 탄환'], ['กระสุนปืนพื้นฐาน ยิงแล้วหมดไป ต้องซื้อเติม', 'Basic gun bullets. Used up when fired; buy more', 'Đạn súng cơ bản. Bắn là mất, cần mua thêm', '기본 총알. 쏘면 사라지니 다시 사야 합니다'],
    ['กระสุนเหล็กกล้า', 'Steel Bullet', 'Đạn thép', '강철 탄환'], ['กระสุนเจาะเกราะ แรงกว่ากระสุนตะกั่ว', 'Armor-piercing, stronger than lead bullets', 'Đạn xuyên giáp, mạnh hơn đạn chì', '철갑탄. 납 탄환보다 강합니다'],
    ['· ถือสองมือ', '· Two-handed', '· Cầm hai tay', '· 양손'], ['· เป็นทั้งอาวุธและโล่ (ถือสองมือ)', '· Both weapon and shield (two-handed)', '· Vừa là vũ khí vừa là khiên (hai tay)', '· 무기이자 방패 (양손)'],
    ['· ต้องใช้', '· Requires', '· Yêu cầu', '· 필요'], ['· เพิ่ม MP สูงสุด', '· Max MP up', '· Tăng MP tối đa', '· 최대 MP 증가'],
    ['เฉพาะ', 'Only', 'Chỉ dành cho', '전용:'], ['ต้อง Lv', 'Needs Lv', 'Cần Lv', '필요 Lv'],
    ['ถอดอุปกรณ์ที่ใช้ไม่ได้แล้วเก็บเข้ากระเป๋า', 'Unusable gear was unequipped and put in your bag', 'Trang bị không dùng được đã được tháo cất vào túi', '사용할 수 없는 장비를 해제해 가방에 넣었습니다'],
    ['ถืออาวุธสองมืออยู่ ใส่ของมืออีกข้างไม่ได้', 'You are holding a two-handed weapon; no off-hand item allowed', 'Đang cầm vũ khí hai tay, không thể mặc đồ tay phụ', '양손 무기를 들고 있어 보조손 장비를 착용할 수 없습니다'],
    ['เพราะอาวุธนี้ถือสองมือ', 'because this weapon is two-handed', 'vì vũ khí này cầm hai tay', '이 무기는 양손용이라서'],
    ['ถือดาบคู่! (ดาบมือซ้าย:', 'Dual swords! (left-hand sword:', 'Song kiếm! (kiếm tay trái:', '쌍검! (왼손 검:'],
    ['ใส่ ', 'Cannot equip ', 'Không thể mặc ', '착용 불가: '],
    ['ไม่ได้:', ' —', ' —', ' —'],
    ['ถอด ', 'Unequipped ', 'Đã tháo ', '해제: '],
    ['ไม่มีลูกธนู — ซื้อที่ร้านอาวุธแล้วสวมใส่ในช่องกระสุน', 'No arrows — buy some at the weapon shop and equip them in the ammo slot', 'Hết tên — mua ở tiệm vũ khí rồi mặc vào ô đạn', '화살이 없습니다 — 무기점에서 사서 탄약칸에 착용하세요'],
    ['ไม่มีกระสุน — ซื้อที่ร้านอาวุธแล้วสวมใส่ในช่องกระสุน', 'No bullets — buy some at the weapon shop and equip them in the ammo slot', 'Hết đạn — mua ở tiệm vũ khí rồi mặc vào ô đạn', '총알이 없습니다 — 무기점에서 사서 탄약칸에 착용하세요'],
    ['ลูกธนู/กระสุนหมดแล้ว', 'Out of arrows/bullets', 'Hết tên/đạn', '화살/총알이 떨어졌습니다'],
    ['x:ลูกธนู', 'Arrows', 'Tên', '화살'], ['x:วุ้น', 'Jelly', 'Slime', '젤리'], ['x:เขี้ยว', 'Tusk', 'Nanh', '어금니'], ['x:ยา', 'Potion', 'Thuốc', '물약'],
    // ---- ร้านค้า
    ['x:ทั้งหมด', 'All', 'Tất cả', '전체'], ['x:ใช้ได้', 'Usable', 'Dùng được', '사용 가능'],
    ['x:ซื้อ', 'Buy', 'Mua', '구매'], ['ซื้อ ×20', 'Buy ×20', 'Mua ×20', '구매 ×20'], ['/ชิ้น', '/each', '/cái', '/개'],
    ['x:ขาย', 'Sell', 'Bán', '판매'], ['ขาย 1', 'Sell 1', 'Bán 1', '1개 판매'],
    ['ไม่มีอุปกรณ์ให้ขาย', 'No equipment to sell', 'Không có trang bị để bán', '판매할 장비가 없습니다'],
    ['ไม่มีของให้ขาย — ไปล่ามอนสเตอร์ก่อนนะ', 'Nothing to sell — go hunt some monsters first', 'Không có gì để bán — hãy đi săn quái trước', '팔 물건이 없어요 — 먼저 몬스터를 사냥하세요'],
    ['เดินเข้าไปใกล้ร้านค้าก่อนนะ', 'Walk closer to the shop first', 'Hãy đến gần cửa hàng trước', '먼저 상점 가까이 가세요'],
    ['เหรียญไม่พอ (ต้องใช้', 'Not enough coins (needs', 'Không đủ xu (cần', '코인 부족 (필요'],
    ['ยังใส่ไม่ได้', 'Cannot equip yet', 'Chưa thể mặc', '아직 착용 불가'],
    // ---- สกิล
    ['ใช้งาน · ตีเดี่ยว', 'Active · single target', 'Chủ động · đơn mục tiêu', '액티브 · 단일 대상'], ['ใช้งาน · ระยะไกล', 'Active · ranged', 'Chủ động · tầm xa', '액티브 · 원거리'],
    ['ใช้งาน · รอบตัว', 'Active · around you', 'Chủ động · quanh bạn', '액티브 · 주변'], ['ใช้งาน · ระเบิดที่เป้าหมาย', 'Active · blast at target', 'Chủ động · nổ tại mục tiêu', '액티브 · 대상 폭발'],
    ['x:บัฟ', 'Buff', 'Buff', '버프'], ['x:ฟื้นฟู', 'Heal', 'Hồi phục', '회복'], ['ติดตัว (พาสซีฟ)', 'Passive', 'Bị động', '패시브'],
    ['ไม้ตาย · รอบตัว', 'Ultimate · around you', 'Tuyệt chiêu · quanh bạn', '필살기 · 주변'], ['ไม้ตาย · ระยะไกล', 'Ultimate · ranged', 'Tuyệt chiêu · tầm xa', '필살기 · 원거리'], ['ไม้ตาย · ตีหนัก', 'Ultimate · heavy hit', 'Tuyệt chiêu · đòn nặng', '필살기 · 강타'],
    ['สกิล · แต้มสกิล', 'Skills · Skill points', 'Kỹ năng · Điểm kỹ năng', '스킬 · 스킬 포인트'],
    ['x:ยืมสกิล', 'Borrow', 'Mượn kỹ năng', '스킬 빌리기'], ['x:สกิลสุ่ม', 'Random', 'Ngẫu nhiên', '랜덤 스킬'],
    ['ปลดล็อกช่องยืมที่เลเวล', 'Borrow slot unlocks at Lv', 'Ô mượn mở khóa ở Lv', '스킬 빌리기 칸 해제 레벨'],
    ['ปลดล็อกสกิลสุ่มที่เลเวล', 'Random skill unlocks at Lv', 'Kỹ năng ngẫu nhiên mở khóa ở Lv', '랜덤 스킬 해제 레벨'],
    ['Adventurer ยืมสกิลใช้งานจากอาชีพอื่นได้ (ช่องปลดล็อกที่ Lv 10 / 30 / 50 / 70) พลังตามเลเวล', 'Adventurers can borrow active skills from other jobs (slots unlock at Lv 10 / 30 / 50 / 70). Power scales with level', 'Adventurer có thể mượn kỹ năng chủ động của nghề khác (mở ở Lv 10 / 30 / 50 / 70). Sức mạnh theo cấp độ', 'Adventurer는 다른 직업의 액티브 스킬을 빌릴 수 있어요 (Lv 10 / 30 / 50 / 70에 칸 해제). 위력은 레벨에 비례'],
    ['Solo Player ได้สกิลสุ่มจากอาชีพอื่นทุก 10 เลเวล (Lv 50 / 60 / 70 / 80 / 90) ใช้ได้ทันทีไม่มีเงื่อนไข พลังตามเลเวล', 'Solo Players get a random skill from another job every 10 levels (Lv 50 / 60 / 70 / 80 / 90), usable with no conditions. Power scales with level', 'Solo Player nhận 1 kỹ năng ngẫu nhiên của nghề khác mỗi 10 cấp (Lv 50 / 60 / 70 / 80 / 90), dùng không điều kiện. Sức mạnh theo cấp độ', 'Solo Player는 10레벨마다 (Lv 50 / 60 / 70 / 80 / 90) 다른 직업의 스킬을 무작위로 얻고, 조건 없이 쓸 수 있어요. 위력은 레벨에 비례'],
    ['แตะไอคอนอีกครั้งเพื่อยกไปวางที่คีย์ลัด', 'Tap the icon again to pick it up and place it on the hotbar', 'Chạm biểu tượng lần nữa để nhấc và đặt vào phím tắt', '아이콘을 다시 누르면 단축키에 놓을 수 있어요'],
    ['เปลี่ยนสกิลที่ยืม', 'Change borrowed skill', 'Đổi kỹ năng đã mượn', '빌린 스킬 변경'], ['เลือกสกิลที่จะยืม', 'Choose a skill to borrow', 'Chọn kỹ năng để mượn', '빌릴 스킬 선택'],
    ['x:เอาออก', 'Remove', 'Gỡ bỏ', '제거'], ['แตะช่องเพื่อเลือกสกิลที่จะยืม', 'Tap a slot to choose a skill to borrow', 'Chạm ô để chọn kỹ năng mượn', '칸을 눌러 빌릴 스킬을 고르세요'],
    ['ยังไม่ได้สกิลสุ่มในช่องนี้', 'No random skill in this slot yet', 'Chưa có kỹ năng ngẫu nhiên ở ô này', '이 칸에는 아직 랜덤 스킬이 없어요'],
    ['ได้รับสกิลสุ่ม:', 'Got a random skill:', 'Nhận kỹ năng ngẫu nhiên:', '랜덤 스킬 획득:'],
    ['ช่องยืมสกิลนี้ยังว่างอยู่', 'This borrow slot is empty', 'Ô mượn kỹ năng này còn trống', '이 스킬 칸은 비어 있습니다'],
    ['ยังไม่ปลดล็อก', 'Not unlocked yet', 'Chưa mở khóa', '아직 해제되지 않았어요'],
    ['สกิลติดตัว ใช้งานอัตโนมัติ', 'Passive skill, works automatically', 'Kỹ năng bị động, tự động có tác dụng', '패시브 스킬, 자동 적용'],
    ['ต้องเรียนสกิลก่อน', 'Learn the previous skill first', 'Hãy học kỹ năng trước đó', '먼저 이전 스킬을 배우세요'],
    ['วงกลม = ใช้งาน · มนเหลี่ยม = บัฟ · สี่เหลี่ยมคม = ติดตัว', 'Circle = active · rounded square = buff · sharp square = passive', 'Tròn = chủ động · vuông bo = buff · vuông nhọn = bị động', '원 = 액티브 · 둥근 사각형 = 버프 · 각진 사각형 = 패시브'],
    ['คูลดาวน์', 'Cooldown', 'Hồi chiêu', '쿨다운'], ['re:(\\d)\\s*วิ(?![ก-๙])', '$1s', '$1 giây', '$1초'],
    ['เลเวลถัดไป:', 'Next level:', 'Cấp tiếp theo:', '다음 레벨:'], ['อัปเกรด (', 'Upgrade (', 'Nâng cấp (', '강화 ('], ['เรียนสกิล (', 'Learn skill (', 'Học kỹ năng (', '스킬 배우기 ('], ['แต้ม)', 'pts)', 'điểm)', '포인트)'],
    ['แตะไอคอนอีกครั้งเพื่อยกไปวางที่ช่องคีย์ลัด', 'Tap the icon again to place it on the hotbar', 'Chạm biểu tượng lần nữa để đặt vào phím tắt', '아이콘을 다시 누르면 단축키에 놓을 수 있어요'],
    ['แตะสกิล 1 ครั้งเพื่อดูรายละเอียดและเรียน', 'Tap a skill once for details and to learn it', 'Chạm kỹ năng 1 lần để xem chi tiết và học', '스킬을 한 번 누르면 상세 정보와 배우기'],
    ['ต้องเป็นอาชีพ', 'Requires job:', 'Cần nghề:', '필요 직업:'], ['เฉพาะ Solo Player', 'Solo Player only', 'Chỉ Solo Player', 'Solo Player 전용'],
    ['ต้องเลเวล', 'Requires Lv', 'Cần Lv', '필요 레벨'], ['ต้องเลื่อนเป็นคลาส 4 (Lv 80)', 'Requires Class 4 (Lv 80)', 'Cần lên Lớp 4 (Lv 80)', '4차 직업(Lv 80) 필요'],
    ['ปลดล็อกหลังเกิดใหม่ (เฉพาะอาชีพเดิม)', 'Unlocks after rebirth (original job only)', 'Mở khóa sau khi tái sinh (chỉ nghề gốc)', '환생 후 해제 (원래 직업만)'],
    ['ต้องเรียน', 'Learn ', 'Hãy học ', '먼저 배우기: '], ['ก่อน', ' first', ' trước', ''],
    ['เลเวลสูงสุดแล้ว', 'Max level reached', 'Đã đạt cấp tối đa', '최대 레벨입니다'], ['อัปต่อได้ที่เลเวล', 'Can upgrade further at Lv', 'Nâng tiếp ở Lv', '다음 강화 가능 레벨'],
    ['แต้มสกิลไม่พอ (ต้องใช้', 'Not enough skill points (needs', 'Không đủ điểm kỹ năng (cần', '스킬 포인트 부족 (필요'],
    ['x:ต้อง', 'Requires', 'Cần', '필요'],
    ['· ระยะ', '· Range', '· Tầm', '· 사거리'], ['ดาเมจ', 'Damage ', 'Sát thương ', '피해 '], ['ของพลังโจมตี', ' of ATK', ' của sức tấn công', ' (공격력 기준)'],
    ['โจมตีศัตรูรอบตัวในรัศมี', 'Hits enemies around you within radius', 'Đánh kẻ địch quanh bạn trong bán kính', '주변 반경 내 적 공격:'], ['ช่อง ดาเมจ', 'tiles. Damage', 'ô. Sát thương', '칸. 피해'],
    ['ระเบิดรอบเป้าหมายรัศมี', 'Explodes around the target, radius', 'Nổ quanh mục tiêu, bán kính', '대상 주변 폭발, 반경'],
    ['พลังโจมตี +', 'ATK +', 'Tấn công +', '공격력 +'], ['นาน', 'for', 'trong', '지속'], ['วินาที', 'seconds', 'giây', '초'],
    ['ของเลือดสูงสุด (รวมเพื่อนใกล้ ๆ)', ' of max HP (nearby allies too)', ' máu tối đa (gồm đồng đội gần đó)', ' (주변 아군 포함)'], ['(ถาวร)', '(permanent)', '(vĩnh viễn)', '(영구)'],
    ['x:พลังโจมตี', 'ATK', 'Sức tấn công', '공격력'], ['โอกาสคริติคอล', 'Crit chance', 'Tỉ lệ chí mạng', '치명타 확률'], ['โอกาสหลบ', 'Dodge chance', 'Tỉ lệ né', '회피율'],
    ['เลือดสูงสุด', 'Max HP', 'Máu tối đa', '최대 HP'], ['x:MP สูงสุด', 'Max MP', 'MP tối đa', '최대 MP'], ['x:พลังป้องกัน', 'DEF', 'Phòng thủ', '방어력'], ['ความเร็วโจมตี', 'Attack speed', 'Tốc độ đánh', '공격 속도'], ['พลังฟื้นฟู', 'Healing power', 'Sức hồi phục', '회복력'],
    ['x:โจมตีเป้าหมาย', 'Single-target attack', 'Đánh đơn mục tiêu', '단일 대상 공격'], ['x:โจมตีระยะไกล', 'Ranged attack', 'Tấn công tầm xa', '원거리 공격'], ['x:โจมตีรอบตัว', 'Area attack', 'Tấn công quanh người', '주변 공격'],
    ['x:ระเบิดรอบเป้าหมาย', 'Target blast', 'Nổ quanh mục tiêu', '대상 폭발'], ['x:บัฟพลังโจมตี', 'ATK buff', 'Buff tấn công', '공격 버프'], ['x:บัฟป้องกัน', 'DEF buff', 'Buff phòng thủ', '방어 버프'], ['x:พาสซีฟ', 'Passive', 'Bị động', '패시브'],
    ['x:ท่าไม้ตายรอบตัว', 'Ultimate (area)', 'Tuyệt chiêu (quanh người)', '필살기 (주변)'], ['x:ท่าไม้ตายระยะไกล', 'Ultimate (ranged)', 'Tuyệt chiêu (tầm xa)', '필살기 (원거리)'], ['x:ท่าไม้ตายโจมตีหนัก', 'Ultimate (heavy)', 'Tuyệt chiêu (nặng)', '필살기 (강타)'],
    ['ไม่มีมอนสเตอร์ใกล้ ๆ', 'No monsters nearby', 'Không có quái gần đây', '근처에 몬스터가 없습니다'], ['ไม่มีศัตรูอยู่รอบตัว', 'No enemies around you', 'Không có kẻ địch quanh bạn', '주변에 적이 없습니다'],
    ['⚔ บัฟ', '⚔ Buff', '⚔ Buff', '⚔ 버프'], ['🛡 บัฟ', '🛡 Buff', '🛡 Buff', '🛡 버프'],
    // ---- สถานะ / เลื่อนอาชีพ
    ['พลังโจมตีกายภาพ', 'Physical attack', 'Tấn công vật lý', '물리 공격력'], ['หลบ/ตีเร็ว', 'Dodge / fast attacks', 'Né / đánh nhanh', '회피 / 빠른 공격'], ['เลือด/ป้องกัน', 'HP / defense', 'Máu / phòng thủ', 'HP / 방어'],
    ['MP/เวท/ฟื้นฟู', 'MP / magic / healing', 'MP / phép / hồi phục', 'MP / 마법 / 회복'], ['ยิงไกล/ตีเร็ว', 'Ranged / fast attacks', 'Bắn xa / đánh nhanh', '원거리 / 빠른 공격'], ['x:คริติคอล', 'Critical', 'Chí mạng', '치명타'],
    ['สถานะตัวละคร', 'Character status', 'Trạng thái nhân vật', '캐릭터 상태'], ['x:อาชีพ', 'Job', 'Nghề', '직업'], ['x:เลเวล', 'Level', 'Cấp độ', '레벨'], ['· เกิดใหม่', '· Rebirth', '· Tái sinh', '· 환생'],
    ['x:ฝ่าย', 'Faction', 'Phe', '진영'], ['แต้มสเตตัส', 'Stat points', 'Điểm chỉ số', '스탯 포인트'], ['x:ป้องกัน', 'Defense', 'Phòng thủ', '방어'], ['x:เลือด', 'HP', 'Máu', 'HP'],
    ['ตี/วินาที', 'Hits/sec', 'Đòn/giây', '초당 타격'], ['ระยะตี', 'Attack range', 'Tầm đánh', '공격 사거리'], ['re:(\\d)\\s*ช่อง', '$1 tiles', '$1 ô', '$1칸'], ['x:ช่อง', 'tiles', 'ô', '칸'], ['x:หลบ', 'Dodge', 'Né', '회피'],
    ['x:เลื่อนอาชีพ', 'Change Job', 'Chuyển nghề', '전직'], ['รีเซ็ตสเตตัส', 'Reset stats', 'Đặt lại chỉ số', '스탯 초기화'], ['(ฟรี)', '(free)', '(miễn phí)', '(무료)'], ['รีเซ็ตสกิล', 'Reset skills', 'Đặt lại kỹ năng', '스킬 초기화'],
    ['รีเซ็ตต้องเสียเหรียญ เพราะผ่านคลาส 2 แล้ว', 'Resetting costs coins because you have passed Class 2', 'Đặt lại tốn xu vì bạn đã qua Lớp 2', '2차 직업을 지나서 초기화에 코인이 듭니다'],
    ['รีเซ็ตฟรีจนกว่าจะเปลี่ยนคลาส 2 เสร็จ', 'Resets are free until you finish Class 2', 'Đặt lại miễn phí cho đến khi xong Lớp 2', '2차 전직을 마칠 때까지 초기화 무료'],
    ['เส้นทาง:', 'Path:', 'Lộ trình:', '경로:'], ['(คลาส 4)', '(Class 4)', '(Lớp 4)', '(4차)'], ['ไม่มีขั้นถัดไป', 'No further advancement', 'Không còn bước tiếp theo', '다음 단계 없음'],
    ['Lv 50 ขึ้นไป: เลือกเป็น "Solo Player" ได้ (ไม่ต้องเลือกฝ่าย · ดาบคู่ · ได้สกิลสุ่มทุก 10 เลเวล · ถือดาบจะได้ฉายา Black Swordsman) หรือเลือกอาชีพสายปกติ', 'Lv 50+: you may become a "Solo Player" (no faction · dual swords · a random skill every 10 levels · wielding a sword earns the title Black Swordsman) or pick a normal job', 'Từ Lv 50: có thể chọn "Solo Player" (không cần chọn phe · song kiếm · nhận kỹ năng ngẫu nhiên mỗi 10 cấp · cầm kiếm sẽ có danh hiệu Black Swordsman) hoặc chọn nghề thường', 'Lv 50 이상: "Solo Player"를 선택할 수 있어요 (진영 선택 없음 · 쌍검 · 10레벨마다 랜덤 스킬 · 검을 들면 칭호 Black Swordsman). 일반 직업도 선택 가능'],
    ['เลือกอาชีพถัดไป', 'Choose your next job', 'Chọn nghề tiếp theo', '다음 직업 선택'], ['สกิล:', 'Skills:', 'Kỹ năng:', '스킬:'], ['อาวุธเฉพาะอาชีพ:', 'Job-exclusive weapons:', 'Vũ khí riêng của nghề:', '직업 전용 무기:'], ['เลื่อนเป็น', 'Become', 'Lên nghề', '전직:'],
    ['Lv 30: เลือกฝ่ายก่อนเลื่อนคลาส 2 — เปลี่ยนสีออร่าและเอฟเฟกต์ของตัวละคร', 'Lv 30: choose a faction before Class 2 — changes your aura colour and effects', 'Lv 30: chọn phe trước khi lên Lớp 2 — đổi màu hào quang và hiệu ứng', 'Lv 30: 2차 전직 전에 진영을 고르세요 — 오라 색과 효과가 바뀝니다'],
    ['แสงทอง · ฟื้นฟูและป้องกันดีขึ้นเล็กน้อย', 'Golden light · slightly better healing and defense', 'Ánh vàng · hồi phục và phòng thủ tốt hơn một chút', '황금빛 · 회복과 방어가 약간 상승'], ['เงามืด · ดาเมจแรงขึ้นเล็กน้อย', 'Shadow · slightly higher damage', 'Bóng tối · sát thương cao hơn một chút', '그림자 · 피해가 약간 상승'],
    ['คลาส 4 (Lv 80): เพิ่มสกิลไม้ตายใหม่ 1 อัน', 'Class 4 (Lv 80): gain 1 new ultimate skill', 'Lớp 4 (Lv 80): thêm 1 tuyệt chiêu mới', '4차 (Lv 80): 새 필살기 1개 획득'], ['x:เลื่อนเป็นคลาส 4', 'Advance to Class 4', 'Lên Lớp 4', '4차 전직'],
    ['เควสต์เกิดใหม่ (Lv 99): ส่งก้อนวุ้นไผ่ ×', 'Rebirth quest (Lv 99): hand in Bamboo Jelly Lump ×', 'Nhiệm vụ tái sinh (Lv 99): nộp Cục slime tre ×', '환생 퀘스트 (Lv 99): 대나무 젤리 덩어리 ×'], ['· เขี้ยวหมูป่า ×', '· Boar Tusk ×', '· Nanh heo rừng ×', '· 멧돼지 어금니 ×'], ['· เหรียญ', '· Coins', '· Xu', '· 코인'],
    ['\nกลับเป็น Lv 1 สกิลแรงขึ้น 15% ต่อครั้ง ได้แต้มสเตตัสเพิ่ม และเมื่อถึงคลาส 4 อีกครั้ง จะได้สกิลพิเศษ (เฉพาะอาชีพเดิมเท่านั้น)', '\nReturn to Lv 1; skills get 15% stronger per rebirth, more stat points, and reaching Class 4 again grants a special skill (original job only)', '\nQuay về Lv 1; kỹ năng mạnh hơn 15% mỗi lần, thêm điểm chỉ số, và khi lên Lớp 4 lần nữa sẽ nhận kỹ năng đặc biệt (chỉ nghề gốc)', '\nLv 1로 돌아가며 환생마다 스킬이 15% 강해지고 스탯 포인트가 늘며, 다시 4차가 되면 특수 스킬을 얻습니다 (원래 직업만)'],
    ['เกิดใหม่ — คงอาชีพเดิม', 'Rebirth — keep your job', 'Tái sinh — giữ nghề cũ', '환생 — 직업 유지'], ['เกิดใหม่ — เริ่มสายอาชีพใหม่', 'Rebirth — start a new job line', 'Tái sinh — bắt đầu nhánh nghề mới', '환생 — 새 직업 계열로 시작'],
    ['ของยังไม่ครบสำหรับเควสต์เกิดใหม่', 'You lack the items for the rebirth quest', 'Chưa đủ vật phẩm cho nhiệm vụ tái sinh', '환생 퀘스트에 필요한 아이템이 부족합니다'],
    ['สเตตัสนี้เต็มแล้ว', 'This stat is maxed', 'Chỉ số này đã đầy', '이 스탯은 최대입니다'], ['แต้มสเตตัสไม่พอ', 'Not enough stat points', 'Không đủ điểm chỉ số', '스탯 포인트가 부족합니다'],
    ['ยังเลื่อนขั้นไม่ได้:', 'Cannot advance yet:', 'Chưa thể lên bậc:', '아직 전직할 수 없습니다:'], ['ถึง Lv', 'Reach Lv', 'Đạt Lv', 'Lv 달성:'],
    ['คุณคือ Solo Player แล้ว — ไม่มีคลาสถัดไป', 'You are a Solo Player — there is no next class', 'Bạn đã là Solo Player — không còn lớp tiếp theo', '당신은 이미 Solo Player입니다 — 다음 직업은 없어요'],
    ['เลือกฝ่าย Dharma แล้ว', 'Chose the Dharma faction', 'Đã chọn phe Dharma', 'Dharma 진영을 선택했습니다'], ['เลือกฝ่าย Adharma แล้ว', 'Chose the Adharma faction', 'Đã chọn phe Adharma', 'Adharma 진영을 선택했습니다'],
    ['เลื่อนเป็นคลาส 4! ปลดล็อกสกิลไม้ตายแล้ว', 'Advanced to Class 4! Ultimate skill unlocked', 'Đã lên Lớp 4! Mở khóa tuyệt chiêu', '4차 전직! 필살기가 해제되었습니다'],
    ['เควสต์เกิดใหม่ต้องใช้: ก้อนวุ้นไผ่ ×', 'Rebirth quest needs: Bamboo Jelly Lump ×', 'Nhiệm vụ tái sinh cần: Cục slime tre ×', '환생 퀘스트 필요: 대나무 젤리 덩어리 ×'], ['เขี้ยวหมูป่า ×', 'Boar Tusk ×', 'Nanh heo rừng ×', '멧돼지 어금니 ×'],
    ['! กลับเป็น Lv 1 แต่สกิลแรงขึ้น', '! Back to Lv 1 but your skills are stronger', '! Quay về Lv 1 nhưng kỹ năng mạnh hơn', '! Lv 1로 돌아갔지만 스킬이 강해졌습니다'],
    ['ต้องใช้', 'Needs', 'Cần', '필요'], ['เหรียญในการรีเซ็ต', 'coins to reset', 'xu để đặt lại', '코인이 필요합니다'], ['รีเซ็ต', 'Reset ', 'Đặt lại ', '초기화: '], ['x:สเตตัส', 'stats', 'chỉ số', '스탯'],
    ['แล้ว (-', ' (-', ' (-', ' (-'], ['(ฟรี จนกว่าจะเปลี่ยนคลาส 2)', '(free until Class 2)', '(miễn phí đến Lớp 2)', '(2차 전직까지 무료)'],
    ['มีแต้มสเตตัสที่ยังไม่ได้ใช้', 'You have unspent stat points:', 'Bạn còn điểm chỉ số chưa dùng:', '사용하지 않은 스탯 포인트:'], ['x:แต้ม', 'pts', 'điểm', '포인트'],
    ['ยังเลื่อนขั้นไม่ได้', 'Cannot advance yet', 'Chưa thể lên bậc', '아직 전직할 수 없습니다'],
    // ---- GM
    ['GM · เมนูทดสอบ', 'GM · Test menu', 'GM · Menu thử nghiệm', 'GM · 테스트 메뉴'], ['x:ตั้งเลเวล', 'Set level', 'Đặt cấp độ', '레벨 설정'], ['x:เปลี่ยนอาชีพทันที', 'Switch job instantly', 'Đổi nghề ngay', '즉시 직업 변경'], ['(คลาส', '(Class', '(Lớp', '(차수'],
    ['x:คลาส 4', 'Class 4', 'Lớp 4', '4차'], ['เกิดใหม่ (ตั้งจำนวนครั้ง)', 'Rebirth (set count)', 'Tái sinh (đặt số lần)', '환생 (횟수 설정)'], ['x:ของ', 'Items', 'Vật phẩm', '아이템'], ['+20000 เหรียญ', '+20000 coins', '+20000 xu', '+20000 코인'],
    ['x:ฟื้นเลือด/MP', 'Heal HP/MP', 'Hồi máu/MP', 'HP/MP 회복'], ['ให้อาวุธ/เกราะ (เลือกประเภท ระดับ 0-4):', 'Give weapon/armor (choose type, tier 0-4):', 'Tặng vũ khí/giáp (chọn loại, bậc 0-4):', '무기/방어구 지급 (종류, 등급 0-4 선택):'], ['ระดับ', 'Tier', 'Bậc', '등급'],
    // ---- เควสต์
    ['รางวัล: EXP', 'Reward: EXP', 'Phần thưởng: EXP', '보상: EXP'], ['ส่งเควสต์ที่', 'Turn in at', 'Nộp nhiệm vụ tại', '퀘스트 제출:'], ['จดหมายนกพิราบ · เควสต์', 'Pigeon letter · Quests', 'Thư bồ câu · Nhiệm vụ', '비둘기 편지 · 퀘스트'],
    ['ยังไม่มีเควสต์ใหม่ — เลเวลสูงขึ้นแล้วจะมีจดหมายมาอีก', 'No new quests — more letters will come as you level up', 'Chưa có nhiệm vụ mới — lên cấp sẽ có thêm thư', '새 퀘스트가 없어요 — 레벨이 오르면 편지가 또 옵니다'],
    ['x:เควสต์ใหม่', 'New quest', 'Nhiệm vụ mới', '새 퀘스트'], ['x:ครบแล้ว', 'Complete', 'Đã đủ', '완료'], ['x:กำลังทำ', 'In progress', 'Đang làm', '진행 중'], ['เป้าหมาย:', 'Goal:', 'Mục tiêu:', '목표:'], ['x:ไปหา', 'Go to', 'Đến gặp', '가기:'],
    ['ไปที่เป้าหมาย ›', 'Go to target ›', 'Đến mục tiêu ›', '목표로 이동 ›'], ['x:รับเควสต์', 'Accept quest', 'Nhận nhiệm vụ', '퀘스트 수락'], ['ส่งเควสต์ · รับรางวัล', 'Turn in · claim reward', 'Nộp nhiệm vụ · nhận thưởng', '퀘스트 제출 · 보상 받기'],
    ['ยังไม่เจอเป้าหมายใกล้ ๆ รอสักครู่นะ', 'No target nearby yet, wait a moment', 'Chưa thấy mục tiêu gần đây, chờ chút nhé', '근처에 목표가 아직 없어요. 잠시만 기다리세요'],
    ['เดินเข้าไปใกล้ผู้ให้เควสต์ก่อนนะ', 'Walk closer to the quest giver first', 'Hãy đến gần người giao nhiệm vụ trước', '먼저 퀘스트 NPC 가까이 가세요'], ['รับเควสต์:', 'Quest accepted:', 'Đã nhận nhiệm vụ:', '퀘스트 수락:'],
    ['วุ้นไผ่เกลื่อนทุ่ง', 'Jelly Over the Field', 'Slime tre tràn đồng', '들판의 젤리 떼'], ['ล่าวุ้นไผ่', 'Hunt Bamboo Jelly', 'Săn slime tre', '대나무 젤리 사냥'],
    ['ทุ่งไผ่เขียวทางเหนือมีวุ้นไผ่เพิ่มขึ้นมากจนชาวบ้านไม่กล้าไปเก็บฟืน ช่วยไปกำจัดมันสัก 5 ตัวได้ไหม ข้าจะตอบแทนอย่างงาม', 'So many bamboo jellies have spread across the northern field that villagers dare not gather firewood. Could you clear 5 of them? I will reward you well.', 'Slime tre ở cánh đồng phía bắc nhiều đến mức dân làng không dám đi nhặt củi. Giúp ta diệt 5 con được không? Ta sẽ hậu tạ.', '북쪽 들판에 대나무 젤리가 너무 늘어 마을 사람들이 땔감을 못 모아요. 5마리만 처치해 주겠소? 후하게 보답하리다.'],
    ['วุ้นไผ่ยังเยอะอยู่นะ สู้ไหวไหม ถ้าเลือดน้อยก็กินสมุนไพรเสียก่อน', 'There are still plenty of jellies. Can you handle them? Eat an herb if your HP is low.', 'Slime tre vẫn còn nhiều. Đánh nổi không? Máu thấp thì ăn thảo dược trước nhé.', '젤리가 아직 많아요. 괜찮겠소? HP가 낮으면 약초를 먹어요.'],
    ['เก่งมาก! ชาวบ้านจะได้เก็บฟืนกันได้เสียที นี่ค่าตอบแทนของเจ้า', 'Well done! The villagers can finally gather firewood. Here is your reward.', 'Giỏi lắm! Dân làng cuối cùng cũng nhặt củi được rồi. Đây là phần thưởng của ngươi.', '훌륭하오! 이제 마을 사람들이 땔감을 모을 수 있겠소. 보상을 받으시오.'],
    ['หมูป่าอาละวาด', 'Boar Rampage', 'Heo rừng nổi loạn', '날뛰는 멧돼지'], ['ล่าหมูป่าไผ่', 'Hunt Bamboo Boars', 'Săn heo rừng tre', '대나무 멧돼지 사냥'],
    ['หมูป่าไผ่พวกนี้ไล่ขวิดพ่อค้าที่ผ่านมาพักโรงเตี๊ยมข้า หากเจ้าปราบมันได้ 5 ตัว ข้าจะให้ยาบำรุงกำลังกับเงินก้อนหนึ่ง', 'These bamboo boars keep goring merchants who stay at my inn. Defeat 5 of them and I will give you a vigor tonic and some coins.', 'Lũ heo rừng tre này húc thương nhân ghé quán ta. Diệt 5 con, ta sẽ tặng thuốc bổ sức và một khoản tiền.', '이 대나무 멧돼지들이 우리 여관에 묵는 상인을 들이받아요. 5마리를 처치하면 활력 보약과 돈을 드리리다.'],
    ['หมูป่าอยู่ทางเหนือของทุ่ง ระวังเขี้ยวมันด้วยนะ', 'The boars are in the north of the field. Watch out for their tusks.', 'Heo rừng ở phía bắc cánh đồng. Cẩn thận nanh của chúng nhé.', '멧돼지는 들판 북쪽에 있소. 어금니를 조심하시오.'],
    ['ดีเหลือเกิน! พ่อค้าจะได้เดินทางสบายใจ รับรางวัลไปเลย', 'Excellent! Merchants can travel in peace. Take your reward.', 'Tuyệt vời! Thương nhân có thể yên tâm lên đường. Nhận thưởng đi.', '훌륭하오! 상인들이 안심하고 다니겠소. 보상을 받으시오.'],
    ['เขี้ยวของช่างตีเหล็ก', 'The Blacksmith’s Tusks', 'Nanh cho thợ rèn', '대장장이의 어금니'], ['เก็บเขี้ยวหมูป่า', 'Collect Boar Tusks', 'Thu thập nanh heo rừng', '멧돼지 어금니 모으기'],
    ['ช่างตีเหล็กอยากได้เขี้ยวหมูป่าไปทำด้ามมีด ข้าเฝ้าประตูไปไหนไม่ได้ เจ้าช่วยเก็บเขี้ยวหมูป่ามาให้ข้า 5 อันที เดี๋ยวข้าจัดการต่อเอง', 'The blacksmith wants boar tusks for knife handles. I cannot leave the gate. Bring me 5 boar tusks and I will handle the rest.', 'Thợ rèn muốn nanh heo rừng làm cán dao. Ta canh cổng không đi được. Mang cho ta 5 chiếc nanh, phần còn lại ta lo.', '대장장이가 칼자루용 멧돼지 어금니를 원하오. 나는 문을 지켜야 하니 어금니 5개를 가져다주시오. 나머지는 내가 처리하리다.'],
    ['เขี้ยวหมูป่าได้จากการล่าหมูป่าไผ่ แต่ไม่ได้ทุกตัวนะ ใจเย็น ๆ', 'Tusks drop from bamboo boars, but not every one. Be patient.', 'Nanh rơi từ heo rừng tre nhưng không phải con nào cũng có. Bình tĩnh nhé.', '어금니는 대나무 멧돼지에게서 얻지만 모두가 주는 건 아니오. 느긋하게 하시오.'],
    ['เขี้ยวสวยทั้งนั้น! ข้าเอาไปให้ช่างตีเหล็กเอง นี่รางวัลของเจ้า', 'All beautiful tusks! I will deliver them to the blacksmith. Here is your reward.', 'Toàn nanh đẹp! Ta sẽ đưa cho thợ rèn. Đây là phần thưởng của ngươi.', '모두 멋진 어금니구려! 내가 대장장이에게 전하겠소. 보상을 받으시오.'],
    ['กวาดล้างหมูป่า', 'Boar Purge', 'Quét sạch heo rừng', '멧돼지 소탕'],
    ['ฝูงหมูป่ายังไม่หมดไป เจ้าฝีมือดีขึ้นมากแล้ว ปราบอีก 15 ตัวเถิด ข้ามีดาบเหล็กกล้าเก็บไว้ จะมอบให้เป็นรางวัล', 'The boar herd is not gone yet. You have grown skilled; defeat 15 more. I have a steel sword saved as your reward.', 'Bầy heo rừng vẫn chưa hết. Ngươi đã giỏi hơn nhiều, diệt thêm 15 con đi. Ta có thanh kiếm thép để dành làm phần thưởng.', '멧돼지 무리가 아직 남았소. 실력이 많이 늘었으니 15마리를 더 처치하시오. 보상으로 강철 검을 마련해 두었소.'],
    ['เหลืออีกไม่มากแล้ว สู้ต่อไป!', 'Not many left. Keep fighting!', 'Còn lại không nhiều nữa. Cố lên!', '이제 얼마 안 남았소. 계속 싸우시오!'],
    ['หมู่บ้านเราปลอดภัยเพราะเจ้าแท้ ๆ รับดาบเล่มนี้ไว้เถิด', 'Our village is safe thanks to you. Take this sword.', 'Làng ta bình yên là nhờ ngươi. Nhận thanh kiếm này đi.', '우리 마을이 안전한 건 모두 그대 덕이오. 이 검을 받으시오.'],
    // ---- ล็อกอิน / บัญชี
    ['เกมออนไลน์สไตล์ RO', 'An RO-style online game', 'Game online phong cách RO', 'RO 스타일 온라인 게임'], ['x:เล่น', 'Play', 'Chơi', '플레이'], ['x:สมัคร', 'Sign up', 'Đăng ký', '가입'], ['ลืมรหัสผ่าน', 'Forgot password', 'Quên mật khẩu', '비밀번호 찾기'],
    ['ล็อกอินด้วย Google', 'Sign in with Google', 'Đăng nhập bằng Google', 'Google로 로그인'], ['สมัครบัญชีใหม่', 'Create a new account', 'Tạo tài khoản mới', '새 계정 만들기'], ['← กลับหน้าล็อกอิน', '← Back to sign-in', '← Về trang đăng nhập', '← 로그인으로 돌아가기'],
    ['x:รหัสผ่าน', 'Password', 'Mật khẩu', '비밀번호'], ['x:ไอดี', 'ID', 'ID', '아이디'], ['อีเมล หรือไอดี (a-z 0-9 _)', 'Email or ID (a-z 0-9 _)', 'Email hoặc ID (a-z 0-9 _)', '이메일 또는 아이디 (a-z 0-9 _)'], ['อีเมล หรือไอดี', 'Email or ID', 'Email hoặc ID', '이메일 또는 아이디'],
    ['ตั้งไอดี (a-z 0-9 _ , 3-16 ตัว)', 'Choose an ID (a-z 0-9 _ , 3-16 chars)', 'Đặt ID (a-z 0-9 _ , 3-16 ký tự)', '아이디 정하기 (a-z 0-9 _ , 3-16자)'], ['ตั้งรหัสผ่าน (6 ตัวขึ้นไป)', 'Choose a password (6+ chars)', 'Đặt mật khẩu (từ 6 ký tự)', '비밀번호 정하기 (6자 이상)'],
    ['ใส่รหัสผ่านอีกครั้ง', 'Re-enter password', 'Nhập lại mật khẩu', '비밀번호 다시 입력'], ['รหัสกู้คืน XXXX-XXXX-XXXX', 'Recovery code XXXX-XXXX-XXXX', 'Mã khôi phục XXXX-XXXX-XXXX', '복구 코드 XXXX-XXXX-XXXX'], ['รหัสผ่านใหม่ (6 ตัวขึ้นไป)', 'New password (6+ chars)', 'Mật khẩu mới (từ 6 ký tự)', '새 비밀번호 (6자 이상)'],
    ['เล่นแบบเกสต์ (ไม่ต้องสมัคร)', 'Play as guest (no sign-up)', 'Chơi khách (không cần đăng ký)', '게스트로 플레이 (가입 불필요)'], ['x:เกสต์', 'Guest', 'Khách', '게스트'], ['x:ผู้เล่น', 'Player', 'Người chơi', '플레이어'],
    ['ส่งลิงก์รีเซ็ตรหัสผ่าน', 'Send password reset link', 'Gửi liên kết đặt lại mật khẩu', '비밀번호 재설정 링크 보내기'], ['ใส่อีเมลที่สมัครไว้ เราจะส่งลิงก์ตั้งรหัสผ่านใหม่ไปให้', 'Enter your registered email and we will send you a reset link', 'Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết đặt lại mật khẩu', '가입한 이메일을 입력하면 재설정 링크를 보내 드립니다'],
    ['ใส่ไอดี + รหัสกู้คืนที่ได้ตอนสมัคร แล้วตั้งรหัสผ่านใหม่', 'Enter your ID + the recovery code from sign-up, then set a new password', 'Nhập ID + mã khôi phục nhận khi đăng ký rồi đặt mật khẩu mới', '아이디 + 가입 때 받은 복구 코드를 입력하고 새 비밀번호를 정하세요'], ['x:ตั้งรหัสผ่านใหม่', 'Set new password', 'Đặt mật khẩu mới', '새 비밀번호 설정'],
    ['นี่คือ', 'This is your', 'Đây là', '이것은'], ['x:รหัสกู้คืน', 'Recovery code', 'Mã khôi phục', '복구 코드'], ['ใช้ตอนลืมรหัสผ่าน — จดหรือแคปหน้าจอเก็บไว้ จะแสดงครั้งเดียวเท่านั้น', 'Use it if you forget your password — write it down or screenshot it; it is shown only once', 'Dùng khi quên mật khẩu — hãy ghi lại hoặc chụp màn hình; chỉ hiển thị một lần', '비밀번호를 잊었을 때 사용 — 적어 두거나 캡처하세요. 한 번만 표시됩니다'],
    ['คัดลอกรหัส', 'Copy code', 'Sao chép mã', '코드 복사'], ['จดไว้แล้ว ไปสร้างตัวละคร', 'Noted — create a character', 'Đã ghi lại — tạo nhân vật', '적어 두었어요 — 캐릭터 만들기'], ['คัดลอกแล้ว ✓', 'Copied ✓', 'Đã sao chép ✓', '복사됨 ✓'],
    ['ไอดีต้องเป็น a-z 0-9 _ ยาว 3-16 ตัว', 'ID must be a-z 0-9 _ , 3-16 characters', 'ID phải gồm a-z 0-9 _ , dài 3-16 ký tự', '아이디는 a-z 0-9 _ 3-16자여야 합니다'], ['รหัสผ่านต้องยาว 6-64 ตัว', 'Password must be 6-64 characters', 'Mật khẩu phải dài 6-64 ký tự', '비밀번호는 6-64자여야 합니다'],
    ['ไอดีนี้มีคนใช้แล้ว', 'This ID is taken', 'ID này đã có người dùng', '이미 사용 중인 아이디입니다'], ['ไอดีหรือรหัสผ่านไม่ถูกต้อง', 'Incorrect ID or password', 'ID hoặc mật khẩu không đúng', '아이디 또는 비밀번호가 올바르지 않습니다'],
    ['รหัสผ่านใหม่ต้องยาว 6-64 ตัว', 'New password must be 6-64 characters', 'Mật khẩu mới phải dài 6-64 ký tự', '새 비밀번호는 6-64자여야 합니다'], ['ไอดีหรือรหัสกู้คืนไม่ถูกต้อง', 'Incorrect ID or recovery code', 'ID hoặc mã khôi phục không đúng', '아이디 또는 복구 코드가 올바르지 않습니다'],
    ['ล็อกอินด้วย Google ใช้ได้เมื่อรันเซิร์ฟเวอร์ออนไลน์จริงและตั้งค่า Google ไว้', 'Google sign-in works when running the real online server with Google configured', 'Đăng nhập Google dùng được khi chạy máy chủ online thật và đã cấu hình Google', 'Google 로그인은 실제 온라인 서버에서 Google 설정을 했을 때 사용할 수 있습니다'],
    ['ล็อกอินด้วย Google ใช้ได้เมื่อตั้งค่า Firebase ไว้ — โหมดนี้ใช้ไอดี/รหัสผ่านหรือเกสต์ไปก่อนนะ', 'Google sign-in needs Firebase to be configured — use ID/password or guest for now', 'Đăng nhập Google cần cấu hình Firebase — tạm thời dùng ID/mật khẩu hoặc khách', 'Google 로그인은 Firebase 설정이 필요합니다 — 지금은 아이디/비밀번호나 게스트를 이용하세요'],
    ['ผู้ดูแลยังไม่ได้เปิดใช้ล็อกอินด้วย Google (ตั้งค่า Firebase หรือ GOOGLE_CLIENT_ID)', 'The admin has not enabled Google sign-in (set up Firebase or GOOGLE_CLIENT_ID)', 'Quản trị viên chưa bật đăng nhập Google (cấu hình Firebase hoặc GOOGLE_CLIENT_ID)', '관리자가 Google 로그인을 아직 켜지 않았습니다 (Firebase 또는 GOOGLE_CLIENT_ID 설정)'],
    ['หมดเวลาเข้าสู่ระบบ', 'Sign-in timed out', 'Hết thời gian đăng nhập', '로그인 시간이 초과되었습니다'], ['re:สร้างตัวละครได้สูงสุด\\s*(\\d+)\\s*ตัว', 'You can create up to $1 characters', 'Tạo tối đa $1 nhân vật', '캐릭터는 최대 $1개까지'],
    ['ชื่อตัวละครสั้นเกินไป (อย่างน้อย 2 ตัว)', 'Character name is too short (min 2 characters)', 'Tên nhân vật quá ngắn (tối thiểu 2 ký tự)', '캐릭터 이름이 너무 짧습니다 (2자 이상)'], ['ชื่อนี้มีคนใช้แล้ว', 'This name is taken', 'Tên này đã có người dùng', '이미 사용 중인 이름입니다'],
    ['ไม่พบตัวละครนี้', 'Character not found', 'Không tìm thấy nhân vật này', '캐릭터를 찾을 수 없습니다'], ['ไม่รู้จักคำสั่งนี้', 'Unknown command', 'Lệnh không xác định', '알 수 없는 명령입니다'], ['เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ลองใหม่อีกครั้ง', 'Cannot reach the server, try again', 'Không kết nối được máy chủ, hãy thử lại', '서버에 연결할 수 없습니다. 다시 시도하세요'],
    ['บัญชี:', 'Account:', 'Tài khoản:', '계정:'], ['ออกจากระบบ (เกสต์จะเสียตัวละคร)', 'Log out (guests lose their characters)', 'Đăng xuất (khách sẽ mất nhân vật)', '로그아웃 (게스트는 캐릭터가 사라집니다)'], ['x:ออกจากระบบ', 'Log out', 'Đăng xuất', '로그아웃'],
    ['x:เลือกตัวละคร', 'Select a character', 'Chọn nhân vật', '캐릭터 선택'], ['x:ช่องว่าง', 'Empty slot', 'Ô trống', '빈 슬롯'], ['x:สร้างตัวละคร', 'Create character', 'Tạo nhân vật', '캐릭터 생성'], ['x:ลบตัวละคร', 'Delete character', 'Xóa nhân vật', '캐릭터 삭제'],
    ['x:ยกเลิก', 'Cancel', 'Hủy', '취소'], ['x:ลบถาวร', 'Delete forever', 'Xóa vĩnh viễn', '영구 삭제'], ['x:ชาย', 'Male', 'Nam', '남성'], ['x:หญิง', 'Female', 'Nữ', '여성'], ['x:← กลับ', '← Back', '← Quay lại', '← 뒤로'],
    ['ชื่อตัวละคร', 'Character name', 'Tên nhân vật', '캐릭터 이름'], ['x:ทรงผม', 'Hair style', 'Kiểu tóc', '헤어스타일'], ['x:สีผม', 'Hair colour', 'Màu tóc', '머리 색'],
    ['ตั้งชื่อตัวละครอย่างน้อย 2 ตัวอักษรนะ', 'Name your character with at least 2 characters', 'Đặt tên nhân vật ít nhất 2 ký tự', '캐릭터 이름은 2자 이상으로 지어 주세요'], ['กำลังสร้าง…', 'Creating…', 'Đang tạo…', '생성 중…'], ['กำลังเข้าเกม…', 'Entering the game…', 'Đang vào game…', '게임에 접속 중…'],
    ['ลบตัวละคร "', 'Delete character "', 'Xóa nhân vật "', '캐릭터 삭제: "'], [') ถาวร? กู้คืนไม่ได้นะ', ') permanently? This cannot be undone', ') vĩnh viễn? Không thể khôi phục', ') 영구 삭제할까요? 복구할 수 없습니다'], ['ลบตัวละครแล้ว', 'Character deleted', 'Đã xóa nhân vật', '캐릭터를 삭제했습니다'],
    ['สมัครสำเร็จ!', 'Signed up!', 'Đăng ký thành công!', '가입 완료!'], ['ตั้งรหัสผ่านใหม่แล้ว', 'Password updated', 'Đã đặt mật khẩu mới', '비밀번호가 변경되었습니다'], ['อีเมลไม่ถูกต้อง', 'Invalid email', 'Email không hợp lệ', '이메일이 올바르지 않습니다'], ['ใส่อีเมลก่อนนะ', 'Enter your email first', 'Hãy nhập email trước', '먼저 이메일을 입력하세요'],
    ['อีเมลนี้สมัครไว้แล้ว — ลองล็อกอินแทน', 'This email is already registered — try signing in', 'Email này đã đăng ký — hãy thử đăng nhập', '이미 가입된 이메일입니다 — 로그인해 보세요'], ['รหัสผ่านสั้นเกินไป (อย่างน้อย 6 ตัว)', 'Password too short (min 6 characters)', 'Mật khẩu quá ngắn (tối thiểu 6 ký tự)', '비밀번호가 너무 짧습니다 (6자 이상)'],
    ['อีเมลหรือรหัสผ่านไม่ถูกต้อง', 'Incorrect email or password', 'Email hoặc mật khẩu không đúng', '이메일 또는 비밀번호가 올바르지 않습니다'], ['ลองถี่เกินไป รอสักครู่แล้วลองใหม่', 'Too many attempts, wait a moment and retry', 'Thử quá nhiều lần, chờ một lát rồi thử lại', '시도가 너무 잦습니다. 잠시 후 다시 시도하세요'], ['ลองถี่เกินไป รอสักครู่นะ', 'Too many attempts, wait a moment', 'Thử quá nhiều lần, chờ một lát', '시도가 너무 잦습니다. 잠시만 기다리세요'],
    ['เชื่อมต่ออินเทอร์เน็ตไม่ได้', 'No internet connection', 'Không có kết nối Internet', '인터넷에 연결할 수 없습니다'], ['ปิดหน้าต่าง Google ก่อนล็อกอินเสร็จ', 'The Google window was closed before sign-in finished', 'Đã đóng cửa sổ Google trước khi đăng nhập xong', '로그인을 마치기 전에 Google 창을 닫았습니다'],
    ['วิธีล็อกอินนี้ยังไม่ถูกเปิดใน Firebase Console', 'This sign-in method is not enabled in the Firebase Console', 'Phương thức đăng nhập này chưa được bật trong Firebase Console', '이 로그인 방식이 Firebase 콘솔에서 켜져 있지 않습니다'], ['โดเมนนี้ยังไม่อยู่ใน Authorized domains ของ Firebase', 'This domain is not in Firebase Authorized domains', 'Tên miền này chưa có trong Authorized domains của Firebase', '이 도메인이 Firebase 승인된 도메인에 없습니다'],
    ['บัญชีนี้ถูกระงับ', 'This account is suspended', 'Tài khoản này đã bị khóa', '이 계정은 정지되었습니다'], ['ใส่รหัสผ่านก่อนนะ', 'Enter your password first', 'Hãy nhập mật khẩu trước', '먼저 비밀번호를 입력하세요'], ['apiKey ใน firebase-config.js ไม่ถูกต้อง', 'apiKey in firebase-config.js is invalid', 'apiKey trong firebase-config.js không hợp lệ', 'firebase-config.js의 apiKey가 올바르지 않습니다'],
    ['เกิดข้อผิดพลาด (', 'An error occurred (', 'Đã xảy ra lỗi (', '오류가 발생했습니다 ('], ['ใส่อีเมลและรหัสผ่านก่อนนะ', 'Enter your email and password first', 'Hãy nhập email và mật khẩu trước', '먼저 이메일과 비밀번호를 입력하세요'], ['ใส่ไอดีและรหัสผ่านก่อนนะ', 'Enter your ID and password first', 'Hãy nhập ID và mật khẩu trước', '먼저 아이디와 비밀번호를 입력하세요'],
    ['รหัสผ่านสองช่องไม่ตรงกัน', 'The two passwords do not match', 'Hai mật khẩu không khớp', '두 비밀번호가 일치하지 않습니다'], ['ใส่อีเมลที่สมัครไว้ให้ถูกต้อง', 'Enter the registered email correctly', 'Hãy nhập đúng email đã đăng ký', '가입한 이메일을 정확히 입력하세요'],
    ['ส่งลิงก์ตั้งรหัสผ่านใหม่ไปที่', 'Sent a password reset link to', 'Đã gửi liên kết đặt lại mật khẩu tới', '비밀번호 재설정 링크를 보냈습니다:'], ['แล้ว (ถ้าไม่เห็นให้ดูในสแปม)', ' (check spam if you do not see it)', ' (xem thư rác nếu không thấy)', ' (보이지 않으면 스팸함을 확인하세요)'],
    ['เชื่อมต่อเซิร์ฟเวอร์ไม่ได้', 'Cannot reach the server', 'Không kết nối được máy chủ', '서버에 연결할 수 없습니다'], ['· โหลด Firebase ไม่ได้ จึงใช้ระบบบัญชีสำรอง', '· Firebase failed to load, using the backup account system', '· Không tải được Firebase, dùng hệ thống tài khoản dự phòng', '· Firebase를 불러오지 못해 예비 계정 시스템을 사용합니다'],
    ['บันทึกบัญชีไม่ได้:', 'Cannot save account:', 'Không lưu được tài khoản:', '계정을 저장할 수 없습니다:'], ['ระบบรับสมัครเต็มชั่วคราว', 'Sign-ups are temporarily full', 'Hệ thống đăng ký tạm thời đầy', '가입이 일시적으로 가득 찼습니다'], ['ใส่ผิดหลายครั้ง รอ 5 นาทีแล้วลองใหม่', 'Too many wrong attempts, wait 5 minutes', 'Nhập sai nhiều lần, chờ 5 phút rồi thử lại', '여러 번 틀렸습니다. 5분 후 다시 시도하세요'],
    ['ล็อกอินด้วย Google ไม่สำเร็จ', 'Google sign-in failed', 'Đăng nhập Google thất bại', 'Google 로그인에 실패했습니다'], ['หมดเวลาเข้าสู่ระบบ ล็อกอินใหม่อีกครั้ง', 'Sign-in timed out, please log in again', 'Hết thời gian đăng nhập, hãy đăng nhập lại', '로그인 시간이 초과되었습니다. 다시 로그인하세요'], ['ข้อมูลไม่ถูกต้อง', 'Invalid data', 'Dữ liệu không hợp lệ', '잘못된 데이터입니다'], ['เซิร์ฟเวอร์ขัดข้อง ลองใหม่อีกครั้ง', 'Server error, try again', 'Lỗi máy chủ, hãy thử lại', '서버 오류입니다. 다시 시도하세요'],
    ['x:อาชีพ:', 'Job:', 'Nghề:', '직업:'],
    // ---- การตั้งค่า
    ['x:ตั้งค่า', 'Settings', 'Cài đặt', '설정'], ['x:ภาษา', 'Language', 'Ngôn ngữ', '언어'], ['เปลี่ยนภาษาแล้ว', 'Language changed', 'Đã đổi ngôn ngữ', '언어가 변경되었습니다'],
    ['ภาษาจะถูกจำไว้ในเครื่องนี้', 'Your language is remembered on this device', 'Ngôn ngữ được ghi nhớ trên thiết bị này', '선택한 언어는 이 기기에 저장됩니다'],
    ['ชื่อตัวละคร ชื่ออาชีพ และชื่อสกิลเป็นภาษาอังกฤษในทุกภาษา', 'Job and skill names stay in English in every language', 'Tên nghề và kỹ năng giữ nguyên tiếng Anh ở mọi ngôn ngữ', '직업과 스킬 이름은 모든 언어에서 영어로 표시됩니다'],
    // ---- โลกใหม่ (เมือง/แผนที่/เควสต์เปลี่ยนอาชีพ)
    ['◉ คุณอยู่ที่นี่', '◉ You are here', '◉ Bạn đang ở đây', '◉ 현재 위치'], ['· ถึงแล้ว', '· Arrived', '· Đã đến', '· 도착'],
    ['x:แผนที่', 'Map', 'Bản đồ', '지도'],
    ['x:แผนที่โลก', 'World Map', 'Bản đồ thế giới', '월드 맵'],
    ['เมือง · ปลอดภัย ไม่มีมอนสเตอร์', 'Town · safe, no monsters', 'Thị trấn · an toàn, không có quái', '마을 · 안전, 몬스터 없음'],
    ['แมพล่ามอนสเตอร์', 'Hunting map', 'Bản đồ săn quái', '사냥 맵'],
    ['· เลเวล', '· Lv', '· Lv', '· Lv'],
    ['· ยังไม่เคยไป', '· not visited yet', '· chưa từng đến', '· 아직 가 본 적 없음'],
    ['เดินไปที่นี่ ›', 'Walk here ›', 'Đi bộ tới đây ›', '걸어서 가기 ›'],
    ['เดินทางด่วน (', 'Fast travel (', 'Di chuyển nhanh (', '빠른 이동 ('],
    ['เหรียญ)', 'coins)', 'xu)', '코인)'],
    ['x:NPC ในเมือง', 'Town NPCs', 'NPC trong thị trấn', '마을 NPC'],
    ['x:ไปหา ›', 'Go ›', 'Đến ›', '가기 ›'],
    ['x:มอนสเตอร์ในแมพนี้', 'Monsters on this map', 'Quái trong bản đồ này', '이 맵의 몬스터'],
    ['x:ไปล่า ›', 'Hunt ›', 'Săn ›', '사냥 ›'],
    ['x:ไปหาครู ›', 'Go to master ›', 'Đến gặp thầy ›', '스승에게 가기 ›'],
    ['re:^เลือด (\\d+)', 'HP $1', 'Máu $1', 'HP $1'],
    ['· ยิงไกล', '· ranged', '· tầm xa', '· 원거리'],
    ['· บิน', '· flying', '· bay', '· 비행'],
    ['· ดรอป:', '· drops:', '· rơi:', '· 드롭:'],
    ['ผู้ปกครองเมือง', 'Town ruler', 'Người đứng đầu thị trấn', '마을 지도자'],
    ['x:โรงเตี๊ยม', 'Inn', 'Quán trọ', '여관'],
    ['x:ร้านยา', 'Potion shop', 'Tiệm thuốc', '포션 상점'],
    ['x:ช่างตีเหล็ก', 'Blacksmith', 'Thợ rèn', '대장장이'],
    ['x:นักปราชญ์', 'Scholar', 'Học giả', '학자'],
    ['x:ชาวเมือง', 'Townsfolk', 'Dân thị trấn', '마을 주민'],
    ['x:ทหารยาม', 'Guard', 'Lính canh', '경비병'],
    ['x:ครูเปลี่ยนอาชีพ', 'Job master', 'Thầy chuyển nghề', '전직 스승'],
    ['x:พ่อค้า', 'Merchant', 'Thương nhân', '상인'],
    ['ผ่านเควสต์เปลี่ยนอาชีพแล้ว', 'Job-change quest completed', 'Đã hoàn thành nhiệm vụ chuyển nghề', '전직 퀘스트 완료'],
    ['ต้องทำเควสต์:', 'Quest required:', 'Cần làm nhiệm vụ:', '필요한 퀘스트:'],
    ['บททดสอบเปลี่ยนอาชีพ:', 'Job Trial:', 'Thử thách chuyển nghề:', '전직 시험:'],
    ['x:วาร์ปไปแมพ', 'Warp to map', 'Dịch chuyển tới bản đồ', '맵으로 워프'],
    ['ในเมืองไม่มีมอนสเตอร์ — ออกไปแมพล่ามอนก่อนนะ', 'No monsters in town — head to a hunting map first', 'Trong thị trấn không có quái — hãy ra bản đồ săn quái', '마을에는 몬스터가 없어요 — 사냥 맵으로 가세요'],
    ['ฟื้น MP', 'Restores MP', 'Hồi MP', 'MP 회복'],
    ['MP เต็มอยู่แล้ว', 'MP is already full', 'MP đã đầy', 'MP가 가득 찼어요'],
    ['เป้าหมาย:', 'Goal:', 'Mục tiêu:', '목표:'],
    ['re:^ล่า', 'Hunt ', 'Săn ', '사냥: '],
    ['re:^เก็บ', 'Collect ', 'Thu thập ', '수집: '],
    ['Black Swordsman', 'Black Swordsman', 'Black Swordsman', 'Black Swordsman'],
    ['x:ดาบผ่าซุง I', 'Log Splitter I', 'Chẻ khúc gỗ I', '통나무 가르기 I'],
    ['x:โล่กระแทก I', 'Shield Slam I', 'Húc khiên I', '방패 강타 I'],
    ['x:ฮึกเหิม I', 'Valor I', 'Hừng hực khí thế I', '사기충천 I'],
    ['x:โจมตีต่อเนื่อง', 'Chain Attack', 'Đòn liên tiếp', '연속 공격'],
    ['x:โจมตีหนัก', 'Crushing Blow', 'Đòn nặng', '강타 일격'],
    ['x:ชำนาญดาบ I', 'Sword Mastery I', 'Tinh thông kiếm I', '검 숙련 I'],
    ['x:ผู้ใช้ดาบมือเดียว I', 'One-hand Swordsman I', 'Kiếm sĩ một tay I', '한손검 사용자 I'],
    ['x:ชำนาญดาบสองมือ I', 'Two-hand Mastery I', 'Tinh thông kiếm hai tay I', '양손검 숙련 I'],
    ['x:ชำนาญโล่ I', 'Shield Mastery I', 'Tinh thông khiên I', '방패 숙련 I'],
    ['x:ชำนาญอาวุธพร้อมรบ I', 'Battle-ready Mastery I', 'Tinh thông trang bị chiến đấu I', '전투 태세 숙련 I'],
    ['ฟาดดาบตรง ๆ ไปด้านหน้าเหมือนผ่าท่อนซุง ดาเมจ', 'Swing straight ahead like splitting a log. Damage', 'Chém thẳng phía trước như chẻ khúc gỗ. Sát thương', '통나무를 쪼개듯 정면으로 내려칩니다. 피해'],
    ['กระแทกโล่ไปด้านหน้า ดาเมจ', 'Slam your shield straight ahead. Damage', 'Húc khiên thẳng phía trước. Sát thương', '방패로 정면을 강타합니다. 피해'],
    ['(ศัตรูตัวเดียว · ต้องถือดาบ)', '(single target · needs a sword)', '(một mục tiêu · cần kiếm)', '(단일 대상 · 검 필요)'],
    ['(ศัตรูตัวเดียว · ต้องถือโล่)', '(single target · needs a shield)', '(một mục tiêu · cần khiên)', '(단일 대상 · 방패 필요)'],
    ['ฮึกเหิม! โจมตี +', 'Valor! Attack +', 'Hừng hực! Tấn công +', '사기충천! 공격 +'],
    ['เลือดสูงสุด +', 'Max HP +', 'HP tối đa +', '최대 HP +'],
    ['ที่โจมตีปกติจะตีซ้ำอีกครั้งทันที', 'for a basic attack to strike again at once', 'đòn đánh thường đánh thêm một lần', '기본 공격이 즉시 한 번 더 적중'],
    ['เมื่อโจมตีต่อเนื่องติด มีโอกาส', 'When a chain attack lands, chance', 'Khi đòn liên tiếp trúng, xác suất', '연속 공격이 적중하면 확률'],
    ['ที่จะตีหนักจนศัตรูตายทันที (ไม่ได้ผลกับบอส)', 'to deal a killing blow instantly (no effect on bosses)', 'đánh chí mạng hạ gục ngay (vô hiệu với boss)', '즉사 일격 (보스에게는 무효)'],
    ['ถือดาบมือเดียว+โล่: พลังโจมตีและป้องกัน +', 'One-hand sword + shield: attack and defense +', 'Kiếm một tay + khiên: tấn công và phòng thủ +', '한손검+방패: 공격·방어 +'],
    ['ถือดาบมือเดียว: พลังโจมตี +', 'One-hand sword: attack +', 'Kiếm một tay: tấn công +', '한손검: 공격 +'],
    ['ถือแค่ดาบ (ไม่มีโล่): ความเร็วโจมตี +', 'Sword only (no shield): attack speed +', 'Chỉ kiếm (không khiên): tốc độ đánh +', '검만 장착(방패 없음): 공격 속도 +'],
    ['ถือดาบสองมือ: พลังโจมตี +', 'Two-hand sword: attack +', 'Kiếm hai tay: tấn công +', '양손검: 공격 +'],
    ['ถือโล่: พลังป้องกัน +', 'Shield equipped: defense +', 'Cầm khiên: phòng thủ +', '방패 장착: 방어 +'],
    ['โจมตีหนัก!', 'Crushing Blow!', 'Đòn nặng!', '강타 일격!']
  ];
  // ---- ชื่ออาวุธ/เกราะที่ประกอบจาก ชนิด + ระดับ (ลำดับคำต่างกันตามภาษา)
  const TIER = [['ฝึกหัด', 'Apprentice', 'Tập sự', '수련용'], ['เหล็กกล้า', 'Steel', 'Thép', '강철'], ['เงินแท้', 'Silver', 'Bạc', '순은'], ['มังกร', 'Dragon', 'Rồng', '용'], ['ตำนาน', 'Legendary', 'Huyền thoại', '전설']];
  const KIND = [['ดาบ', 'Sword', 'Kiếm', '검'], ['ดาบสองมือ', 'Two-hand Sword', 'Kiếm hai tay', '양손검'], ['โล่', 'Shield', 'Khiên', '방패'], ['โล่ยักษ์', 'Great Shield', 'Khiên khổng lồ', '거대 방패'], ['คาตานะ', 'Katana', 'Katana', '카타나'], ['ถุงมือลูกแก้ว', 'Orb Glove', 'Găng cầu pha lê', '구슬 장갑'], ['ไลท์เซเบอร์', 'Lightsaber', 'Kiếm ánh sáng', '라이트세이버'], ['มีด', 'Dagger', 'Dao găm', '단검'], ['กะตาร์', 'Katar', 'Katar', '카타르'], ['คุไน', 'Kunai', 'Kunai', '쿠나이'], ['แส้', 'Whip', 'Roi da', '채찍'], ['ธนู', 'Bow', 'Cung', '활'], ['ธนูยาว', 'Longbow', 'Cung dài', '장궁'], ['ปืน', 'Gun', 'Súng', '총'], ['คทา', 'Staff', 'Trượng', '지팡이'], ['ไม้เท้าเวท', 'Magic Wand', 'Gậy phép', '마법봉'], ['คัมภีร์', 'Tome', 'Sách phép', '마법서'], ['ถุงมือหมัดยักษ์', 'Giant Fist Gloves', 'Găng quyền khổng lồ', '거대 주먹 장갑'], ['รองเท้าพลัง', 'Power Shoes', 'Giày sức mạnh', '파워 슈즈'], ['กระบอง', 'Club', 'Dùi cui', '곤봉'], ['ถุงมือเสริม', 'Support Glove', 'Găng hỗ trợ', '보조 장갑'], ['เสื้อคลุม', 'Robe', 'Áo choàng', '로브'], ['เกราะหนัง', 'Leather Armor', 'Giáp da', '가죽 갑옷'], ['เกราะเหล็ก', 'Iron Armor', 'Giáp sắt', '철 갑옷']];
  const EX = {}, RE = [];   // EX: ข้อความเต็ม → [en,vi,ko] · RE: regex
  const SUB = [];           // ตัดต่อข้อความ (ยาวก่อน)
  function add(row) {
    const k = row[0], v = [row[1], row[2], row[3]];
    if (k.indexOf('x:') === 0) EX[k.slice(2)] = v;
    else if (k.indexOf('re:') === 0) RE.push([new RegExp(k.slice(3), 'g'), v]);
    else SUB.push([k, v]);
  }
  D.forEach(add);
  for (const k of KIND) for (const t of TIER) {
    const th = k[0] + t[0];
    EX[th] = [t[1] + ' ' + k[1], k[2] + ' ' + t[2].toLowerCase(), t[3] + ' ' + k[3]];
    SUB.push([th, EX[th]]);
  }
  SUB.sort((a, b) => b[0].length - a[0].length);
  const LI = { th: -1, en: 0, vi: 1, ko: 2 };
  let lang = 'th';
  try { const s = localStorage.getItem('bc-lang'); if (s && LI[s] !== undefined) lang = s; } catch (e) { /* ไม่เป็นไร */ }
  const hasTh = s => /[฀-๿]/.test(s);
  const cache = new Map();
  function tr(s, lg) {
    lg = lg || lang;
    if (lg === 'th' || typeof s !== 'string' || !s || !hasTh(s)) return s;
    const i = LI[lg], key = lg + '\u0000' + s;
    if (cache.has(key)) return cache.get(key);
    let out, t = s.trim();
    if (EX[t]) out = s.replace(t, EX[t][i]);
    else {
      out = s;
      for (const [k, v] of SUB) if (out.indexOf(k) >= 0) out = out.split(k).join(v[i]);
      if (hasTh(out)) for (const [re, v] of RE) out = out.replace(re, v[i]);
    }
    if (cache.size > 3000) cache.clear();
    cache.set(key, out);
    return out;
  }
  /* ---- แปลหน้าจอ HTML อัตโนมัติ (ข้อความ + placeholder/title/aria-label) ---- */
  const ATTRS = ['placeholder', 'title', 'aria-label'];
  const orig = new WeakMap();      // node → { th: ข้อความไทยต้นฉบับ, out: ข้อความที่เราใส่ล่าสุด }
  let busy = false;
  function doText(n) {
    const cur = n.nodeValue;
    let o = orig.get(n);
    if (!o || (cur !== o.out && cur !== o.th)) { if (!hasTh(cur) && !o) return; o = { th: cur, out: cur }; orig.set(n, o); }
    const v = lang === 'th' ? o.th : tr(o.th);
    o.out = v; if (cur !== v) n.nodeValue = v;
  }
  function doAttr(el) {
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      const key = '__o_' + a, cur = el.getAttribute(a);
      let o = el[key];
      if (!o || (cur !== o.out && cur !== o.th)) { if (!hasTh(cur) && !o) continue; o = { th: cur, out: cur }; el[key] = o; }
      const v = lang === 'th' ? o.th : tr(o.th);
      o.out = v; if (cur !== v) el.setAttribute(a, v);
    }
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1) return;
    if (root.tagName === 'SCRIPT' || root.tagName === 'STYLE') return;
    doAttr(root);
    for (let c = root.firstChild; c; c = c.nextSibling) walk(c);
  }
  function applyAll() { busy = true; try { walk(document.body); document.title = document.title; } finally { busy = false; } }
  let obs = null, pend = false;
  const queue = new Set();
  function flush() {
    pend = false; busy = true;
    try { for (const n of queue) walk(n); } finally { queue.clear(); busy = false; }
  }
  function start() {
    if (obs || typeof MutationObserver === 'undefined') return;
    obs = new MutationObserver(ms => {
      if (busy) return;
      for (const m of ms) {
        if (m.type === 'characterData') queue.add(m.target);
        else if (m.type === 'attributes') queue.add(m.target);
        else m.addedNodes.forEach(n => queue.add(n));
      }
      if (!pend) { pend = true; (window.requestAnimationFrame || setTimeout)(flush); }
    });
    obs.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }
  function set(l) {
    if (LI[l] === undefined) return;
    lang = l; cache.clear();
    try { localStorage.setItem('bc-lang', l); } catch (e) { /* ไม่เป็นไร */ }
    document.documentElement.lang = l;
    applyAll();
    window.dispatchEvent(new CustomEvent('langchange', { detail: l }));
  }
  function addRows(rows) {   // เพิ่มคำแปลทีหลัง (ชื่อเมือง/มอนสเตอร์ของโลกใหม่)
    for (const r of rows) { if (r && r[0] && !hasTh(r[0]) === false) { const k = r[0]; if (!SUB.some(x => x[0] === k)) SUB.push([k, [r[1], r[2] || r[1], r[3] || r[1]]]); } }
    SUB.sort((a, b) => b[0].length - a[0].length); cache.clear();
  }
  const api = { tr, set, get: () => lang, LANGS, start, applyAll, addRows };
  window.I18N = api;
  window.T = s => tr(s);
  const boot = () => { document.documentElement.lang = lang; applyAll(); start(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
