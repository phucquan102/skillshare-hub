const jwt = require('jsonwebtoken');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const ActiveParticipant = require('../models/ActiveParticipant');

class JitsiService {
  constructor() {
    this.domain = process.env.JITSI_DOMAIN || 'meet.jit.si'; // Đổi về meet.jit.si
    this.appId = process.env.JITSI_APP_ID || '';
    this.kid = process.env.JITSI_KID || '';
    
    // Sửa phần private key - xử lý đúng cách
    this.privateKey = this.loadPrivateKey();
    
    this.enableJWT = this.parseEnvBoolean(process.env.JITSI_ENABLE_JWT);
    
    console.log('🔧 [JitsiService Constructor] Environment Check:');
    console.log('   - JITSI_DOMAIN:', this.domain);
    console.log('   - JITSI_ENABLE_JWT:', this.enableJWT);
    console.log('   - Has PRIVATE_KEY:', !!this.privateKey);
    console.log('   - JWT Status:', this.enableJWT && this.privateKey ? '✅ ENABLED' : '❌ DISABLED');
  }

  // 🆕 THÊM: Hàm load private key đúng cách
  loadPrivateKey() {
    let privateKey = process.env.JITSI_PRIVATE_KEY || '';
    
    if (!privateKey) {
      console.warn('⚠️ JITSI_PRIVATE_KEY not found in environment variables');
      return '';
    }

    // Xử lý multi-line private key từ environment variable
    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
      console.log('   - Converted escaped newlines in private key');
    }

    // Đảm bảo có BEGIN và END markers
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      privateKey = `-----BEGIN PRIVATE KEY-----\n${privateKey}`;
    }
    
    if (!privateKey.includes('-----END PRIVATE KEY-----')) {
      privateKey = `${privateKey}\n-----END PRIVATE KEY-----`;
    }

    // Validate key format
    if (!privateKey.includes('-----BEGIN PRIVATE KEY-----') || !privateKey.includes('-----END PRIVATE KEY-----')) {
      console.error('❌ Invalid private key format after processing');
      return '';
    }

    console.log('   - Private Key Format: ✅ Valid');
    console.log('   - Private Key Length:', privateKey.length);
    
    return privateKey;
  }

  // ✅ NEW: Parse boolean từ env variables đúng cách
  parseEnvBoolean(value) {
    if (!value) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1' || normalized === 'yes';
    }
    return !!value;
  }

  // 🆕 THÊM: Fallback khi không có JWT
  async generateSimpleMeetingConfig(roomName, userInfo, role = 'student') {
    console.log('🔐 [generateSimpleMeetingConfig] Using simple config (no JWT)');
    
    return {
      roomName: roomName,
      width: '100%',
      height: '100%',
      parentNode: undefined,
      configOverwrite: {
        prejoinPageEnabled: false,
        startWithAudioMuted: true,
        startWithVideoMuted: false,
        disableModeratorIndicator: false,
        startScreenSharing: true,
        enableEmailInStats: false,
        enableClosePage: false,
        defaultLanguage: 'en',
        resolution: 720
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        SHOW_BRAND_WATERMARK: false,
        SHOW_POWERED_BY: false,
        TOOLBAR_BUTTONS: [
          'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting',
          'fullscreen', 'fodeviceselection', 'hangup', 'profile', 'chat',
          'recording', 'livestreaming', 'etherpad', 'sharedvideo', 'settings',
          'raisehand', 'videoquality', 'filmstrip', 'invite', 'feedback',
          'stats', 'shortcuts', 'tileview', 'videobackgroundblur', 'download',
          'help', 'mute-everyone', 'security'
        ]
      },
      userInfo: {
        displayName: userInfo.displayName,
        email: userInfo.email
      }
    };
  }

  async generateJWT({ roomName, userInfo, role = 'student', expiresIn = '2h' }) {
    console.log('🔐 [generateJWT] Generating JWT token...');
    console.log('   - Room:', roomName);
    console.log('   - User:', userInfo.displayName);
    console.log('   - Role:', role);
    console.log('   - enableJWT:', this.enableJWT);

    // Nếu không enable JWT hoặc không có private key, trả về null
    if (!this.enableJWT || !this.privateKey) {
      console.log('   - JWT disabled or no private key, returning null');
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      context: {
        user: {
          id: userInfo.email,
          name: userInfo.displayName,
          avatar: userInfo.avatar || '',
          email: userInfo.email,
          affiliation: role
        },
        features: {
          livestreaming: true,
          recording: true,
          transcription: true,
          'outbound-call': true
        }
      },
      aud: 'jitsi',
      iss: this.appId,
      sub: this.appId,
      room: roomName,
      exp: now + 60 * 60 * 2, // 2 hours
      nbf: now - 10
    };

    try {
      // Validate key format
      if (!this.privateKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Invalid private key format: Missing BEGIN marker');
      }
      if (!this.privateKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Invalid private key format: Missing END marker');
      }

      console.log('   - Private Key Format: ✅ Valid');
      
      const token = jwt.sign(payload, this.privateKey, {
        algorithm: 'RS256',
        header: {
          kid: this.kid,
          alg: 'RS256'
        }
      });

      console.log('✅ JWT Token generated successfully');
      console.log('   - Token length:', token.length);
      
      return token;
    } catch (error) {
      console.error('❌ Error generating JWT:', error.message);
      console.error('   - Stack:', error.stack);
      throw new Error('Failed to generate Jitsi JWT token: ' + error.message);
    }
  }

  // 🆕 THÊM: Hàm tạo room name nhất quán
  generateConsistentRoomName(courseId, lessonId) {
    // Tạo room name nhất quán để instructor và student vào cùng phòng
    const roomName = `skillshare-${courseId}-${lessonId}`;
    console.log('   - Consistent Room Name:', roomName);
    return roomName;
  }

  async createMeeting({ roomName, subject, userInfo, isModerator = true, lessonId, userId }) {
    try {
      console.log("🎯 [createMeeting] Starting meeting creation");
      console.log("➡️ LessonId:", lessonId);
      console.log("➡️ UserId:", userId);

      const lesson = await Lesson.findById(lessonId).populate('courseId');
      if (!lesson) throw new Error('Lesson not found');

      console.log("📚 Lesson found:", lesson.title);

      const enrollment = await Enrollment.findOne({
        studentId: userId,
        courseId: lesson.courseId._id
      });

      console.log("📋 Enrollment check:");
      console.log("   - Found:", !!enrollment);
      
      if (!enrollment) {
        throw new Error('❌ Bạn chưa đăng ký khóa học này');
      }

      console.log("   - Status:", enrollment.status);
      console.log("   - Has full access:", enrollment.hasFullAccess);

      let hasAccess = false;
      let accessType = 'none';

      if (enrollment.hasFullAccess) {
        hasAccess = true;
        accessType = 'full_course';
        console.log("🎫 Access: Full course");
      } else if (enrollment.hasAccessToLesson && enrollment.hasAccessToLesson(lessonId)) {
        hasAccess = true;
        accessType = 'single_lesson';
        console.log("🎫 Access: Single lesson purchased");
      } else if (lesson.isFree || lesson.isPreview) {
        hasAccess = true;
        accessType = 'free_preview';
        console.log("🎫 Access: Free/Preview");
      } else {
        throw new Error('❌ Bạn không có quyền truy cập bài học này');
      }

      if (!hasAccess) {
        throw new Error('❌ Bạn không có quyền truy cập bài học này');
      }

      console.log("🔍 Checking if user already active...");
      
      const alreadyActive = await ActiveParticipant.findOne({
        lessonId: lessonId,
        userId: userId,
        isActive: true
      });

      // 🆕 Sửa: Tạo room name nhất quán
      const consistentRoomName = this.generateConsistentRoomName(lesson.courseId._id, lessonId);
      
      if (alreadyActive) {
        console.log("⚠️ User already active, returning existing session");
        
        const currentActiveCount = await ActiveParticipant.countDocuments({
          lessonId: lessonId,
          isActive: true
        });

        return {
          config: alreadyActive.config,
          roomName: consistentRoomName,
          domain: this.domain,
          currentParticipants: currentActiveCount,
          maxParticipants: lesson.maxParticipants || lesson.courseId.maxStudents || 50,
          participantId: alreadyActive._id,
          isRejoining: true,
          message: 'Bạn đã tham gia buổi học này'
        };
      }

      const activeCount = await ActiveParticipant.countDocuments({
        lessonId: lessonId,
        isActive: true
      });

      const maxParticipants = lesson.maxParticipants || lesson.courseId.maxStudents || 50;
      
      console.log(`👥 Current active in meeting: ${activeCount}/${maxParticipants}`);

      if (activeCount >= maxParticipants) {
        throw new Error(`❌ Lớp học đã đầy (${activeCount}/${maxParticipants}), không thể tham gia`);
      }

      console.log(`✅ Access granted. Active: ${activeCount}/${maxParticipants}`);

      lesson.meetingId = consistentRoomName;
      lesson.isMeetingActive = true;
      await lesson.save();

      // 🆕 Sửa: Thêm try-catch cho JWT generation với fallback
      let meetingConfig;
      let jwtToken;

      try {
        jwtToken = await this.generateJWT({
          roomName: consistentRoomName,
          userInfo,
          role: isModerator ? 'teacher' : 'student'
        });
        
        if (jwtToken) {
          meetingConfig = {
            roomName: consistentRoomName,
            width: '100%',
            height: '100%',
            parentNode: undefined,
            configOverwrite: {
              prejoinPageEnabled: false,
              startWithAudioMuted: true,
              startWithVideoMuted: false,
              disableModeratorIndicator: false,
              startScreenSharing: true,
              enableEmailInStats: false,
              enableClosePage: false,
              defaultLanguage: 'en',
              resolution: 720,
              constraints: {
                video: {
                  height: { ideal: 720, max: 720, min: 240 }
                }
              }
            },
            interfaceConfigOverwrite: {
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
              SHOW_BRAND_WATERMARK: false,
              SHOW_POWERED_BY: false,
              TOOLBAR_BUTTONS: [
                'microphone', 'camera', 'closedcaptions', 'desktop', 'embedmeeting',
                'fullscreen', 'fodeviceselection', 'hangup', 'profile', 'chat',
                'recording', 'livestreaming', 'etherpad', 'sharedvideo', 'settings',
                'raisehand', 'videoquality', 'filmstrip', 'invite', 'feedback',
                'stats', 'shortcuts', 'tileview', 'videobackgroundblur', 'download',
                'help', 'mute-everyone', 'security'
              ]
            },
            jwt: jwtToken,
            userInfo: {
              displayName: userInfo.displayName,
              email: userInfo.email
            }
          };
        }
      } catch (jwtError) {
        console.warn('⚠️ JWT generation failed, using simple config:', jwtError.message);
      }

      // Fallback: sử dụng config không có JWT
      if (!meetingConfig) {
        meetingConfig = await this.generateSimpleMeetingConfig(consistentRoomName, userInfo, isModerator ? 'teacher' : 'student');
      }

      const participant = await ActiveParticipant.create({
        lessonId: lessonId,
        userId: userId,
        courseId: lesson.courseId._id,
        userEmail: userInfo.email,
        userName: userInfo.displayName,
        enrollment: enrollment._id,
        accessType: accessType,
        isActive: true,
        joinedAt: new Date(),
        config: meetingConfig
      });

      console.log("✅ Participant record created:", participant._id);

      const newParticipantCount = activeCount + 1;
      lesson.currentParticipants = newParticipantCount;
      await lesson.save();

      console.log(`📊 Updated lesson currentParticipants: ${newParticipantCount}`);

      const result = {
        config: meetingConfig,
        roomName: consistentRoomName,
        domain: this.domain,
        jwtToken: jwtToken,
        currentParticipants: newParticipantCount,
        maxParticipants: maxParticipants,
        participantId: participant._id,
        isRejoining: false,
        enrollmentInfo: {
          hasFullAccess: enrollment.hasFullAccess,
          accessType: accessType,
          status: enrollment.status
        }
      };

      console.log("✅ Meeting created successfully");
      return result;

    } catch (error) {
      console.error('❌ Error creating meeting:', error);
      throw new Error('Failed to create Jitsi meeting: ' + error.message);
    }
  }

  async removeParticipant(participantId, reason = 'user_left') {
    try {
      const participant = await ActiveParticipant.findByIdAndUpdate(
        participantId,
        {
          isActive: false,
          leftAt: new Date(),
          reason: reason
        },
        { new: true }
      );

      if (participant) {
        console.log("✅ Participant removed:", participant.userId, "Reason:", reason);
      }
      return participant;
    } catch (error) {
      console.error('Error removing participant:', error);
    }
  }

  async cleanupInactiveParticipants(lessonId) {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      
      const result = await ActiveParticipant.updateMany(
        {
          lessonId: lessonId,
          isActive: true,
          joinedAt: { $lt: thirtyMinutesAgo }
        },
        {
          isActive: false,
          leftAt: new Date(),
          reason: 'timeout'
        }
      );

      console.log(`🧹 Cleaned up ${result.modifiedCount} timeout participants`);
      return result;
    } catch (error) {
      console.error('Error cleaning up participants:', error);
    }
  }

  async checkMeetingStatus(roomName, userId = null) {
    try {
      const lesson = await Lesson.findOne({ meetingId: roomName }).populate('courseId');
      if (!lesson) return { isActive: false, participants: 0, maxParticipants: 0, hasAccess: false };

      let hasAccess = false;

      if (userId) {
        const enrollment = await Enrollment.findOne({
          studentId: userId,
          courseId: lesson.courseId._id
        });

        if (enrollment && (enrollment.hasFullAccess || (enrollment.hasAccessToLesson && enrollment.hasAccessToLesson(lesson._id)) || lesson.isFree || lesson.isPreview)) {
          hasAccess = true;
        }
      }

      const activeCount = await ActiveParticipant.countDocuments({
        lessonId: lesson._id,
        isActive: true
      });

      const maxParticipants = lesson.maxParticipants || lesson.courseId.maxStudents || 50;

      return {
        isActive: lesson.isMeetingActive || false,
        participants: activeCount,
        maxParticipants: maxParticipants,
        hasAccess: hasAccess,
        lesson: {
          title: lesson.title,
          courseTitle: lesson.courseId.title
        }
      };
    } catch (error) {
      console.error('Error checking meeting status:', error);
      return { 
        isActive: false, 
        participants: 0, 
        maxParticipants: 20, 
        hasAccess: false 
      };
    }
  }

  async endMeeting({ lessonId }) {
    try {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) throw new Error('Lesson not found');

      lesson.isMeetingActive = false;
      lesson.actualEndTime = new Date();
      await lesson.save();

      const result = await ActiveParticipant.updateMany(
        { lessonId: lessonId, isActive: true },
        { 
          isActive: false, 
          leftAt: new Date(),
          reason: 'meeting_ended'
        }
      );

      console.log(`✅ Meeting ended. ${result.modifiedCount} participants removed`);
      return { success: true, message: 'Meeting ended successfully' };
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw new Error('Failed to end Jitsi meeting');
    }
  }

  async checkLessonAccess(userId, lessonId) {
    try {
      const lesson = await Lesson.findById(lessonId).populate('courseId');
      if (!lesson) {
        return { hasAccess: false, message: 'Lesson not found' };
      }

      const enrollment = await Enrollment.findOne({
        studentId: userId,
        courseId: lesson.courseId._id
      });

      let hasAccess = false;
      let accessType = 'none';

      if (enrollment) {
        if (enrollment.hasFullAccess) {
          hasAccess = true;
          accessType = 'full_course';
        } else if (enrollment.hasAccessToLesson && enrollment.hasAccessToLesson(lessonId)) {
          hasAccess = true;
          accessType = 'single_lesson';
        } else if (lesson.isFree || lesson.isPreview) {
          hasAccess = true;
          accessType = 'free_preview';
        }
      } else if (lesson.isFree || lesson.isPreview) {
        hasAccess = true;
        accessType = 'free_preview';
      }

      return {
        hasAccess,
        accessType,
        lesson: {
          _id: lesson._id,
          title: lesson.title,
          isFree: lesson.isFree,
          isPreview: lesson.isPreview
        }
      };
    } catch (error) {
      console.error('Error checking lesson access:', error);
      return { hasAccess: false, message: error.message };
    }
  }
}

module.exports = new JitsiService();