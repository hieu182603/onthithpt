import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subject } from '../../subjects/entities/subject.entity';
import { Topic } from '../../topics/entities/topic.entity';
import { Question, QuestionType, Difficulty } from '../../questions/entities/question.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeederService implements OnModuleInit {
  private readonly logger = new Logger('Seeder');

  constructor(
    @InjectRepository(Subject)
    private subjectRepo: Repository<Subject>,
    @InjectRepository(Topic)
    private topicRepo: Repository<Topic>,
    @InjectRepository(Question)
    private questionRepo: Repository<Question>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async onModuleInit() {
    const subjectCount = await this.subjectRepo.count();
    if (subjectCount === 0) {
      this.logger.log('🌱 Bắt đầu seed Môn học và Chủ đề...');
      await this.seedSubjectsAndTopics();
    }

    const questionCount = await this.questionRepo.count();
    if (questionCount === 0) {
      this.logger.log('🌱 Bắt đầu seed Câu hỏi...');
      await this.seedQuestions();
    }

    const adminExists = await this.userRepo.findOne({ where: { email: 'admin@onthithpt.com' } });
    if (!adminExists) {
      this.logger.log('🌱 Bắt đầu seed Người dùng...');
      await this.seedUsers();
    }

    this.logger.log('✅ Quá trình kiểm tra Seeding hoàn tất!');
  }

  private async seedUsers() {
    const passwordHash = await bcrypt.hash('123456', 10);

    const admin = this.userRepo.create({
      email: 'admin@onthithpt.com',
      password: passwordHash,
      fullName: 'Quản trị viên (Test)',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await this.userRepo.save(admin);

    for (let i = 1; i <= 3; i++) {
      const teacher = this.userRepo.create({
        email: `teacher${i}@onthithpt.com`,
        password: passwordHash,
        fullName: `Giáo viên ${i} (Test)`,
        role: UserRole.TEACHER,
        isActive: true,
      });
      await this.userRepo.save(teacher);
    }

    for (let i = 1; i <= 5; i++) {
      const student = this.userRepo.create({
        email: `student${i}@onthithpt.com`,
        password: passwordHash,
        fullName: `Học sinh ${i} (Test)`,
        role: UserRole.STUDENT,
        isActive: true,
      });
      await this.userRepo.save(student);
    }

    this.logger.log(`  👥 Đã tạo 1 Admin, 3 Giáo viên, 5 Học sinh (Mật khẩu: 123456)`);
  }

  private async seedQuestions() {
    const mathSubject = await this.subjectRepo.findOne({ where: { slug: 'toan-hoc' } });
    if (!mathSubject) return;

    const topics = await this.topicRepo.find({ where: { subjectId: mathSubject.id } });
    if (topics.length === 0) return;

    const mathQuestions = [
      {
        content: 'Tập xác định của hàm số $y = \\frac{1}{x-1}$ là:',
        explanation: 'Điều kiện: $x - 1 \\neq 0 \\Leftrightarrow x \\neq 1$. Vậy $D = \\mathbb{R} \\setminus \\{1\\}$.',
        difficulty: Difficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { content: '$\\mathbb{R} \\setminus \\{1\\}$', isCorrect: true, order: 1 },
          { content: '$\\mathbb{R}$', isCorrect: false, order: 2 },
          { content: '$(1; +\\infty)$', isCorrect: false, order: 3 },
          { content: '$(-\\infty; 1)$', isCorrect: false, order: 4 },
        ]
      },
      {
        content: 'Đạo hàm của hàm số $y = x^3 - 3x$ là:',
        explanation: '$y\' = 3x^2 - 3$',
        difficulty: Difficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { content: '$3x^2 - 3$', isCorrect: true, order: 1 },
          { content: '$3x^2 + 3$', isCorrect: false, order: 2 },
          { content: '$x^2 - 3$', isCorrect: false, order: 3 },
          { content: '$3x - 3$', isCorrect: false, order: 4 },
        ]
      },
      {
        content: 'Nghiệm của phương trình $\\log_2(x-1) = 3$ là:',
        explanation: '$\\log_2(x-1) = 3 \\Leftrightarrow x-1 = 2^3 \\Leftrightarrow x = 9$',
        difficulty: Difficulty.MEDIUM,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { content: '$x = 9$', isCorrect: true, order: 1 },
          { content: '$x = 8$', isCorrect: false, order: 2 },
          { content: '$x = 7$', isCorrect: false, order: 3 },
          { content: '$x = 10$', isCorrect: false, order: 4 },
        ]
      },
      {
        content: 'Thể tích của khối chóp có diện tích đáy $B=6$ và chiều cao $h=4$ là:',
        explanation: '$V = \\frac{1}{3}Bh = \\frac{1}{3} \\cdot 6 \\cdot 4 = 8$',
        difficulty: Difficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { content: '$8$', isCorrect: true, order: 1 },
          { content: '$24$', isCorrect: false, order: 2 },
          { content: '$12$', isCorrect: false, order: 3 },
          { content: '$4$', isCorrect: false, order: 4 },
        ]
      },
      {
        content: 'Cho số phức $z = 3 - 4i$. Môđun của $z$ là:',
        explanation: '$|z| = \\sqrt{3^2 + (-4)^2} = \\sqrt{25} = 5$',
        difficulty: Difficulty.EASY,
        type: QuestionType.SINGLE_CHOICE,
        options: [
          { content: '$5$', isCorrect: true, order: 1 },
          { content: '$25$', isCorrect: false, order: 2 },
          { content: '$7$', isCorrect: false, order: 3 },
          { content: '$1$', isCorrect: false, order: 4 },
        ]
      }
    ];

    const firstTopic = topics[0];
    
    for (const qData of mathQuestions) {
      const question = this.questionRepo.create({
        topicId: firstTopic.id,
        content: qData.content,
        explanation: qData.explanation,
        difficulty: qData.difficulty,
        type: qData.type,
        isActive: true,
        options: qData.options,
      });
      await this.questionRepo.save(question);
    }

    this.logger.log(`  📚 Đã tạo ${mathQuestions.length} câu hỏi mẫu cho môn Toán.`);
  }

  private async seedSubjectsAndTopics() {
    const subjectsData = [
      {
        name: 'Toán học',
        slug: 'toan-hoc',
        icon: '📐',
        description: 'Toán học THPT: Đại số, Giải tích, Hình học',
        topics: [
          'Hàm số và đồ thị',
          'Phương trình - Bất phương trình',
          'Tổ hợp - Xác suất',
          'Dãy số - Cấp số',
          'Giới hạn',
          'Đạo hàm',
          'Nguyên hàm - Tích phân',
          'Số phức',
          'Hình học không gian',
          'Hình học tọa độ',
        ],
      },
      {
        name: 'Vật lý',
        slug: 'vat-ly',
        icon: '⚛️',
        description: 'Vật lý THPT: Cơ học, Điện, Quang, Hạt nhân',
        topics: [
          'Dao động cơ',
          'Sóng cơ và sóng âm',
          'Dòng điện xoay chiều',
          'Dao động và sóng điện từ',
          'Sóng ánh sáng',
          'Lượng tử ánh sáng',
          'Vật lý hạt nhân',
        ],
      },
      {
        name: 'Hóa học',
        slug: 'hoa-hoc',
        icon: '🧪',
        description: 'Hóa học THPT: Vô cơ, Hữu cơ, Đại cương',
        topics: [
          'Este - Lipit',
          'Cacbohidrat',
          'Amin - Amino axit - Protein',
          'Polime',
          'Đại cương kim loại',
          'Kim loại kiềm - Kiềm thổ - Nhôm',
          'Sắt và hợp chất',
          'Hóa học và môi trường',
        ],
      },
      {
        name: 'Sinh học',
        slug: 'sinh-hoc',
        icon: '🧬',
        description: 'Sinh học THPT: Di truyền, Tiến hóa, Sinh thái',
        topics: [
          'Cơ chế di truyền và biến dị',
          'Tính quy luật của hiện tượng di truyền',
          'Di truyền học quần thể',
          'Ứng dụng di truyền học',
          'Tiến hóa',
          'Sinh thái học',
        ],
      },
      {
        name: 'Tiếng Anh',
        slug: 'tieng-anh',
        icon: '🇬🇧',
        description: 'Tiếng Anh THPT: Ngữ pháp, Từ vựng, Đọc hiểu',
        topics: [
          'Ngữ pháp (Grammar)',
          'Từ vựng (Vocabulary)',
          'Đọc hiểu (Reading)',
          'Viết lại câu (Sentence Rewriting)',
          'Phát âm - Trọng âm',
          'Giao tiếp (Communication)',
        ],
      },
      {
        name: 'Ngữ văn',
        slug: 'ngu-van',
        icon: '📖',
        description: 'Ngữ văn THPT: Đọc hiểu, Nghị luận, Văn học',
        topics: [
          'Đọc hiểu văn bản',
          'Nghị luận xã hội',
          'Nghị luận văn học',
          'Văn học Việt Nam hiện đại',
          'Văn học nước ngoài',
        ],
      },
      {
        name: 'Lịch sử',
        slug: 'lich-su',
        icon: '🏛️',
        description: 'Lịch sử THPT: Việt Nam và Thế giới',
        topics: [
          'Lịch sử thế giới hiện đại',
          'Việt Nam 1919-1945',
          'Việt Nam 1945-1954',
          'Việt Nam 1954-1975',
          'Việt Nam 1975 đến nay',
        ],
      },
      {
        name: 'Địa lý',
        slug: 'dia-ly',
        icon: '🌍',
        description: 'Địa lý THPT: Tự nhiên, Kinh tế - Xã hội',
        topics: [
          'Địa lý tự nhiên Việt Nam',
          'Địa lý dân cư',
          'Địa lý kinh tế - Công nghiệp',
          'Địa lý kinh tế - Nông nghiệp',
          'Địa lý các vùng kinh tế',
        ],
      },
      {
        name: 'GDCD',
        slug: 'gdcd',
        icon: '⚖️',
        description: 'Giáo dục công dân THPT: Pháp luật, Kinh tế, Đạo đức',
        topics: [
          'Pháp luật và đời sống',
          'Quyền và nghĩa vụ công dân',
          'Kinh tế vi mô - vĩ mô',
          'Đạo đức và lối sống',
        ],
      },
    ];

    for (const subjectData of subjectsData) {
      const subject = this.subjectRepo.create({
        name: subjectData.name,
        slug: subjectData.slug,
        icon: subjectData.icon,
        description: subjectData.description,
        isActive: true,
      });
      const savedSubject = await this.subjectRepo.save(subject);

      for (let i = 0; i < subjectData.topics.length; i++) {
        const topic = this.topicRepo.create({
          name: subjectData.topics[i],
          slug: subjectData.topics[i]
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, ''),
          subjectId: savedSubject.id,
          order: i + 1,
        });
        await this.topicRepo.save(topic);
      }

      this.logger.log(`  📚 ${subjectData.name}: ${subjectData.topics.length} chủ đề`);
    }
  }
}
