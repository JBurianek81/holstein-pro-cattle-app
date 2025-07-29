const { onSchedule } = require('firebase-functions/v2/scheduler');
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();
const db = admin.firestore();

// Check for task notifications every 30 minutes
exports.checkTaskNotifications = onSchedule({
  schedule: 'every 30 minutes',
  timeZone: 'America/Chicago', // Central Time Zone
  memory: '1GB',
  timeoutSeconds: 540
}, async (event) => {
    console.log('🔔 Checking for task notifications...');
    
    try {
      // Get all tasks
      const tasksSnapshot = await db.collection('tasks').get();
      
      if (tasksSnapshot.empty) {
        console.log('No tasks found');
        return null;
      }
      
      console.log(`Found ${tasksSnapshot.size} tasks to check`);
      
      // Check each task
      for (const taskDoc of tasksSnapshot.docs) {
        const task = taskDoc.data();
        const taskId = taskDoc.id;
        
        // Skip if no assignedTo
        if (!task.assignedTo) {
          continue;
        }
        
        // Get user's notification preferences and timezone
        // Query users collection by email since users are stored by UID
        const usersQuery = await db.collection('users').where('email', '==', task.assignedTo).get();
        
        if (usersQuery.empty) {
          console.log(`User ${task.assignedTo} not found in users collection`);
          continue;
        }
        
        const userDoc = usersQuery.docs[0]; // Get the first matching user
        
        const userData = userDoc.data();
        
        // Check if user wants notifications
        const notifPrefs = userData.notificationPreferences || {};
        if (!notifPrefs.pushNotifications) {
          console.log(`User ${task.assignedTo} has push notifications disabled`);
          continue;
        }
        
        // Get user's timezone (default to Central if not set)
        const userTimezone = userData.timezone || 'America/Chicago';
        
        // Calculate "today" in user's timezone
        const userToday = getDateInTimezone(new Date(), userTimezone);
        const taskDueDate = task.dueDate?.toDate();
        
        // Check if task needs notification
        const isHighPriority = task.priority === 'High';
        const isDueToday = taskDueDate && getDateInTimezone(taskDueDate, userTimezone) === userToday;
        
        if (!isHighPriority && !isDueToday) {
          continue; // Skip this task
        }
        
        // Check if already notified recently (within 24 hours in user's timezone)
        const lastNotified = task.lastNotified?.toDate();
        const userNow = new Date();
        const twentyFourHoursAgo = new Date(userNow.getTime() - 24 * 60 * 60 * 1000);
        
        if (lastNotified && lastNotified > twentyFourHoursAgo) {
          console.log(`Task ${taskId} already notified recently for user ${task.assignedTo}`);
          continue; // Skip if notified recently
        }
        
        // Send push notification
        await sendTaskNotification(task, userData, taskId);
        
                         // Send email notification for high priority tasks or iOS devices
                 const isIOSDevice = userData.fcmTokens && userData.fcmTokens.includes('ios-browser-notifications');
                 if ((task.priority === 'high' || isIOSDevice) && userData.notificationPreferences?.emailNotifications) {
                   await sendEmailNotification(task, userData, taskId);
                 }
        
        // Update lastNotified timestamp
        await db.collection('tasks').doc(taskId).update({
          lastNotified: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      console.log('✅ Task notification check completed');
      return null;
      
    } catch (error) {
      console.error('❌ Error checking task notifications:', error);
      return null;
    }
  });

// Helper function to get date in specific timezone
function getDateInTimezone(date, timezone) {
  try {
    return date.toLocaleDateString('en-CA', { timeZone: timezone }); // Returns YYYY-MM-DD format
  } catch (error) {
    console.error(`Error converting date to timezone ${timezone}:`, error);
    // Fallback to UTC if timezone is invalid
    return date.toISOString().split('T')[0];
  }
}

         // Function to send notification
         async function sendTaskNotification(task, userData, taskId) {
           try {
             const fcmTokens = userData.fcmTokens || [];
             
             if (fcmTokens.length === 0) {
               console.log(`No FCM tokens for user ${task.assignedTo}`);
               return;
             }
             
             const notificationTitle = task.priority === 'High' 
               ? `🚨 High Priority Task: ${task.title}`
               : `📅 Task Due Today: ${task.title}`;
             
             const notificationBody = task.description || 'Click to view details';
             
             // Create notification payload
             const payload = {
               notification: {
                 title: notificationTitle,
                 body: notificationBody,
                 icon: '/favicon.ico',
                 click_action: '/', // Opens your app
               },
               data: {
                 taskId: taskId,
                 type: 'task_notification'
               }
             };
             
             // Send to all user's devices
             const promises = fcmTokens.map(async (token) => {
               try {
                 // Check if it's an iOS device (special token)
                 if (token === 'ios-browser-notifications') {
                   console.log(`📱 iOS device detected for ${task.assignedTo} - will use email notifications`);
                   // For iOS, we rely on email notifications instead
                   return;
                 }
                 
                 await admin.messaging().sendToDevice(token, payload);
                 console.log(`✅ FCM notification sent to ${task.assignedTo} for task: ${task.title}`);
               } catch (error) {
                 console.error(`❌ Failed to send notification to token ${token}:`, error);
                 
                 // Remove invalid tokens
                 if (error.code === 'messaging/registration-token-not-registered') {
                   await db.collection('users').doc(task.assignedTo).update({
                     fcmTokens: admin.firestore.FieldValue.arrayRemove(token)
                   });
                 }
               }
             });
             
             await Promise.all(promises);
             
           } catch (error) {
             console.error('❌ Error sending notification:', error);
           }
         }



// Function to send email notification
async function sendEmailNotification(task, userData, taskId) {
  try {
    // Create transporter (using Gmail SMTP for testing)
    // In production, you'd use a service like SendGrid, Mailgun, or AWS SES
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // Set this in Firebase Functions config
        pass: process.env.EMAIL_PASS  // Set this in Firebase Functions config
      }
    });
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🚨 High Priority Task Alert</h1>
        </div>
        
        <div style="padding: 20px; background: #f8f9fa;">
          <h2 style="color: #dc3545; margin-top: 0;">Task: ${task.title}</h2>
          
          <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p><strong>Priority:</strong> <span style="color: #dc3545; font-weight: bold;">HIGH</span></p>
            <p><strong>Due Date:</strong> ${task.dueDate}</p>
            <p><strong>Created By:</strong> ${task.createdBy}</p>
            ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="https://cattle-management-app-ae01b.web.app" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Task in App
            </a>
          </div>
          
          <p style="color: #6c757d; font-size: 14px; text-align: center;">
            This is an automated notification from your Cattle Management App.
          </p>
        </div>
      </div>
    `;
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: task.assignedTo,
      subject: `🚨 URGENT: ${task.title} - Due ${task.dueDate}`,
      html: emailContent
    };
    
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email notification sent to ${task.assignedTo} for task: ${task.title}`);
    
  } catch (error) {
    console.error('❌ Error sending email notification:', error);
  }
}
