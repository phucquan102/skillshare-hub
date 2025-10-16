const jwt = require('jsonwebtoken');
const Lesson = require('../models/Lesson'); // Giả sử bạn có model Lesson

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
4QU3IYY2gWWATZO6NWussobItNgFMF6n0nGK5XTNpLU7zMcieg6D3yQy4NXLNu3D
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
    this.enableJWT = process.env.JITSI_ENABLE_JWT === 'true';
  }

  async generateJWT({ roomName, userInfo, role = 'student', expiresIn = '2h' }) {
    if (!this.enableJWT) return null;

    const now = Math.floor(Date.now() / 1000);
    const payload = {
      context: {
        user: {
          id: userInfo.email,
          name: userInfo.displayName,
          avatar: userInfo.avatar || '',
          email: userInfo.email,
          affiliation: role // 'teacher' or 'student'
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
      sub: this.appId, // ✅ Với JaaS sub = appId
      room: roomName,
      exp: now + 60 * 60 * 2, // 2h
      nbf: now - 10
    };

    try {
      const formattedKey = this.privateKey.includes('\\n')
        ? this.privateKey.replace(/\\n/g, '\n')
        : this.privateKey;

      return jwt.sign(payload, formattedKey, {
        algorithm: 'RS256',
        header: {
          kid: this.kid,
          alg: 'RS256'
        }
      });
    } catch (error) {
      console.error('❌ Error generating JWT:', error);
      throw new Error('Failed to generate Jitsi JWT token');
    }
  }

  /**
   * 🏗️ Tạo meeting mới
   */
  async createMeeting({ roomName, subject, userInfo, isModerator = true, lessonId }) {
    try {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) throw new Error('Lesson not found');

      // Kiểm tra số người
      const currentParticipants = lesson.currentParticipants || 0;
      const maxParticipants = lesson.maxParticipants || 20;
      if (currentParticipants >= maxParticipants) {
        throw new Error('Phòng họp đã đầy');
      }

      // Cập nhật lesson
      lesson.currentParticipants = currentParticipants + 1;
      lesson.meetingId = roomName;
      lesson.isMeetingActive = true;
      await lesson.save();

      // Tạo JWT
      const jwtToken = await this.generateJWT({
        roomName,
        userInfo,
        role: isModerator ? 'teacher' : 'student'
      });

      // Link phòng họp
      const meetingUrl = jwtToken
        ? `https://${this.domain}/${this.appId}/${roomName}?jwt=${jwtToken}`
        : `https://${this.domain}/${this.appId}/${roomName}`;

      return {
        url: meetingUrl,
        roomName,
        domain: this.domain,
        subject,
        jwtToken,
        currentParticipants: lesson.currentParticipants,
        maxParticipants: lesson.maxParticipants,
        config: {
          prejoinPageEnabled: false,
          startWithAudioMuted: true,
          startWithVideoMuted: false,
          disableModeratorIndicator: false,
          startScreenSharing: true,
          enableEmailInStats: false,
          enableClosePage: false,
          defaultLanguage: 'en'
        },
        interfaceConfig: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          SHOW_BRAND_WATERMARK: false,
          SHOW_POWERED_BY: false
        }
      };
    } catch (error) {
      console.error('❌ Error creating meeting:', error);
      throw new Error('Failed to create Jitsi meeting');
    }
  }

  /**
   * 🧾 Tạo tên phòng duy nhất
   */
  generateRoomName(courseId, lessonId) {
    return `course-${courseId}-lesson-${lessonId}`;
  }

  /**
   * 📡 Kiểm tra trạng thái meeting
   */
  async checkMeetingStatus(roomName) {
    try {
      const lesson = await Lesson.findOne({ meetingId: roomName });
      if (!lesson) return { isActive: false, participants: 0, maxParticipants: 0 };

      return {
        isActive: lesson.isMeetingActive || false,
        participants: lesson.currentParticipants || 0,
        maxParticipants: lesson.maxParticipants || 20
      };
    } catch (error) {
      console.error('Error checking meeting status:', error);
      return { isActive: false, participants: 0, maxParticipants: 20 };
    }
  }

  /**
   * 🔚 Kết thúc meeting
   */
  async endMeeting({ lessonId }) {
    try {
      const lesson = await Lesson.findById(lessonId);
      if (!lesson) throw new Error('Lesson not found');

      lesson.isMeetingActive = false;
      lesson.currentParticipants = 0;
      lesson.actualEndTime = new Date();
      await lesson.save();

      return { success: true, message: 'Meeting ended successfully' };
    } catch (error) {
      console.error('Error ending meeting:', error);
      throw new Error('Failed to end Jitsi meeting');
    }
  }
}

module.exports = new JitsiService();