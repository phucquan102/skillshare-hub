const jwt = require('jsonwebtoken');
const Lesson = require('../models/Lesson');
const Enrollment = require('../models/Enrollment');
const ActiveParticipant = require('../models/ActiveParticipant');

class JitsiService {
  constructor() {
    this.domain = process.env.JITSI_DOMAIN || '8x8.vc';
    this.appId = process.env.JITSI_APP_ID || 'vpaas-magic-cookie-248985b4c05e443c97cc597ce97c823e';
    this.kid = process.env.JITSI_KID || 'vpaas-magic-cookie-248985b4c05e443c97cc597ce97c823e/3446f1-SAMPLE_APP';
    this.privateKey = process.env.JITSI_PRIVATE_KEY || `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCOUsAPuvhasraN
V/Gfl+mekPKsMDgIHRF2kKWMxIgwZghDuNlIqWbOdji3D1JViz3eaW873FayvcOb
UTNnLvOt8z/say1af8xOnCb14wTedNmHssBrrPCGavZ10OH0LZvuNzbla3tXSTBT
is7+JvRN/oStlmBwSao9hoW2cgL9yeKhQo/EMjHCAJ1ZuJs6j608zawJJTucMIYF
HcP48vjPgzPvlM4reiVuY1bTNRyE1v0qUpQvWDRbcqroGB1K4avaxyBB8ixIZOpN
Obu4k1DcYcjvbsJq1x5qVkQm2sq6bGoUPkxXYwVp/wIqjz4ugxm6Soj8tKDZXd7L
PhOXkzCJAgMBAAECggEBAIuR0PFcLKNdMLKptLUKV7r9cE21t60VPIPmU8MZFGlK
Ff67rrGYFs6PlwzGRLrJIvISuVedu5PrjoCo/9zHaYaDzoM9k6t1Olk4vuhRKfwx
4QU3IYY2gWWATZO6NWussobItNgFMF6n0nGK5XTNpLU7zMcieg6D3yQY4NXLNu3D
Z2AcsJ8M8ZfiEBUfNSlKXMMPzFczpvKIvjJRng8nUmZID3w4/QXO05ZP6KAV9uVJ
M7EUJ44BP3JsSILlV1fLaKPjnH68lfG2fyThWF/0gDTZWj+WJu2qGDGpf4YiJtN+
ncsCVfxVEO7ZwafAcbgMPhZHsU8KmwSRo4Pznpga5dECgYEA7WX8G1rESm9EsACn
TAbR+5GbJchFbYjkSjTayfL7MJiOeL63OQStbdxeLwt7/72nrQXjvSmSNr1VRl0U
kkYI6gJT+N8rnk7VGUyq/qnFRbIz2GCpLUnHweqkZ98VzzaemZSjjaWg3VPfeN6v
c2G3L5lfFzPNtrNEZ9tgedNyFI0CgYEAmXmjB9ttiuRyb6jSv0j3N04rjVf3GDDt
LqcQQ6iieXSOI6yx+A18lpm0sqP6nf5zvtoT/sdgXzuP51k4P6GZ0OaqQbfACAI8
TdLziKkuNO+QRyhvs5Hm0PlmhDM1jKyVMf18oq5yuK3TqUSZsWSPDszkzVIzhj9+
fduGzaQlUu0CgYBMK8Dsdf8tcu4zGsKTHk0ZzupdARllv9qgBL1+trvqJ8ju7SKU
5O9QpLiDl8e9kvjOB2m/NCt57N4DqbIEDPynOQAAhnrUXK77YyIqfAaUCk2gS8N8
iIPTsJn3yhiRWBEjbhHcTRyEZ3j4q1rYRq4kU62zICgNSw/T0wvtiu67sQKBgEkS
5VEEZS/Qfbw0gcOaFjs6+PmffIMEKKoh2Vidnl595H+P5lzY7w01uhekg9teH/Yr
F4Ijo/sz/NyGWoXRh88zRLVtq/0kM1pKqrHS+7Ewr11yH108hs3RMcKYL1L/iTn4
G7PJo83S1giuJQ+VdZfybq5kCSxOZwe90n1vPmYxAoGAdZyI03rRxNoLOrqvQvyV
MjcH0KcIjQQuUIVIX+/gi4NlUSNtGciLdaC2q4dM0uxIdtvQDmUT4/kkG+NvyZUe
vZHluT2OlBuDMI8Kc9w4hjWGKf5CLNRi7yniRhUzRRYI6ndir+xPfH5KBfxQelzw
50+Vyq9SM1nn9u+NJiyKmg8=
-----END PRIVATE KEY-----`;

    // ✅ FIX: Đúng cách để kiểm tra boolean từ env
    this.enableJWT = this.parseEnvBoolean(process.env.JITSI_ENABLE_JWT);
    
    console.log('🔧 [JitsiService Constructor] Environment Check:');
    console.log('   - JITSI_ENABLE_JWT (raw):', process.env.JITSI_ENABLE_JWT);
    console.log('   - JITSI_ENABLE_JWT (parsed):', this.enableJWT);
    console.log('   - JITSI_DOMAIN:', this.domain);
    console.log('   - Has JITSI_APP_ID:', !!this.appId);
    console.log('   - Has JITSI_KID:', !!this.kid);
    console.log('   - Has JITSI_PRIVATE_KEY:', !!this.privateKey);
    console.log('   - JWT Status:', this.enableJWT ? '✅ ENABLED' : '❌ DISABLED');
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

  async generateJWT({ roomName, userInfo, role = 'student', expiresIn = '2h' }) {
    console.log('🔐 [generateJWT] Generating JWT token...');
    console.log('   - Room:', roomName);
    console.log('   - User:', userInfo.displayName);
    console.log('   - Role:', role);
    console.log('   - enableJWT:', this.enableJWT);

    if (!this.enableJWT) {
      console.warn('⚠️  WARNING: JWT is disabled in configuration!');
      console.warn('   Please set JITSI_ENABLE_JWT=true in your .env file');
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
      // ✅ FIX: Xử lý key format một cách robust
      let formattedKey = this.privateKey;
      
      // Nếu key chứa \\n (escaped newlines)
      if (formattedKey.includes('\\n')) {
        formattedKey = formattedKey.replace(/\\n/g, '\n');
        console.log('   - Converted escaped newlines to actual newlines');
      }
      
      // Validate key format
      if (!formattedKey.includes('-----BEGIN PRIVATE KEY-----')) {
        throw new Error('Invalid private key format: Missing BEGIN marker');
      }
      if (!formattedKey.includes('-----END PRIVATE KEY-----')) {
        throw new Error('Invalid private key format: Missing END marker');
      }

      console.log('   - Private Key Format: ✅ Valid');
      console.log('   - Private Key Length:', formattedKey.length);
      
      const token = jwt.sign(payload, formattedKey, {
        algorithm: 'RS256',
        header: {
          kid: this.kid,
          alg: 'RS256'
        }
      });

      console.log('✅ JWT Token generated successfully');
      console.log('   - Token length:', token.length);
      console.log('   - Token parts:', token.split('.').length);
      
      return token;
    } catch (error) {
      console.error('❌ Error generating JWT:', error.message);
      console.error('   - Stack:', error.stack);
      console.error('   - Key preview:', this.privateKey?.substring(0, 50) + '...');
      throw new Error('Failed to generate Jitsi JWT token: ' + error.message);
    }
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

      if (alreadyActive) {
        console.log("⚠️ User already active, returning existing session");
        
        const currentActiveCount = await ActiveParticipant.countDocuments({
          lessonId: lessonId,
          isActive: true
        });

        return {
          config: alreadyActive.config,
          roomName,
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

      lesson.meetingId = roomName;
      lesson.isMeetingActive = true;
      await lesson.save();

      // ✅ FIX: Luôn generate JWT, không check flag
      const jwtToken = await this.generateJWT({
        roomName,
        userInfo,
        role: isModerator ? 'teacher' : 'student'
      });

      if (!jwtToken) {
        throw new Error('Failed to generate JWT token');
      }

      const meetingConfig = {
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
        roomName,
        domain: this.domain,
        jwtToken,
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