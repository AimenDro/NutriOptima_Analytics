# Design Document: NutriOptima Analytics

## 1. System Overview

NutriOptima Analytics is a full-stack web application for nutrition tracking with AI-powered food recognition. The system enables users to track meals, water intake, and mood through an intuitive dashboard with automated email reminders.

### 1.1 Architecture

**Frontend:**
- React.js with JSX
- Tailwind CSS for styling
- Recharts for data visualization
- Vite as build tool
- Context API for state management

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- Python services for AI/ML processing
- JWT for authentication
- Nodemailer for email services
- Node-cron for scheduled tasks

**External Services:**
- Google Gemini Vision API for food recognition
- MongoDB Atlas for database hosting
- Gmail SMTP for email delivery

### 1.2 Technology Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend Framework | React.js | 18.x |
| Backend Framework | Express.js | 4.x |
| Database | MongoDB | 6.x |
| ODM | Mongoose | 8.x |
| AI Service | Google Gemini | 2.5 Flash |
| Email Service | Nodemailer | 6.x |
| Scheduler | Node-cron | 3.x |
| Authentication | JWT | 9.x |
| Charts | Recharts | 2.x |

## 2. Data Models

### 2.1 User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, required),
  password: String (hashed, required),
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  activityLevel: String,
  healthConditions: [String], // ['diabetes', 'high_blood_pressure', 'heart_disease', 'high_cholesterol', 'kidney_disease', 'none']
  allergies: [String], // User's food allergies
  dietaryRestrictions: [String], // ['vegetarian', 'vegan', 'gluten_free', 'dairy_free', 'halal', 'kosher']
  goals: {
    dailyCalories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    water: Number
  },
  emailPreferences: {
    mealReminders: Boolean,
    waterReminders: Boolean,
    dietRecommendations: Boolean,
    dailySummary: Boolean
  },
  alertPreferences: {
    enableHealthAlerts: { type: Boolean, default: true },
    enableAllergyAlerts: { type: Boolean, default: true },
    enableDailyLimitAlerts: { type: Boolean, default: true },
    alertSeverityThreshold: { type: String, enum: ['all', 'warning', 'critical'], default: 'all' }
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 DailyTracking Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date,
  meals: [{
    foodName: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    imageUrl: String,
    timestamp: Date,
    mealType: String,
    notes: String
  }],
  waterIntake: [{
    amount: Number,
    timestamp: Date,
    unit: String
  }],
  mood: [{
    value: String,
    timestamp: Date,
    notes: String
  }],
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFats: Number,
  totalWater: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### 2.3 FoodRecognition Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  imageUrl: String,
  recognizedFoods: [{
    name: String,
    confidence: Number,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
    portion: String
  }],
  analysisTimestamp: Date,
  geminiResponse: Object,
  status: String,
  createdAt: Date
}
```

### 2.4 DietPlan Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  planName: String,
  duration: Number,
  targetCalories: Number,
  macroTargets: {
    protein: Number,
    carbs: Number,
    fats: Number
  },
  meals: [{
    day: Number,
    mealType: String,
    foods: [String],
    calories: Number,
    macros: Object
  }],
  createdAt: Date,
  isActive: Boolean
}
```

### 2.5 HealthAlert Model
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User, required),
  userEmail: String (required),
  alertType: {
    type: String,
    enum: ['health_condition', 'nutrient_deficiency', 'daily_limit_exceeded', 'trend_warning'],
    required: true
  },
  severity: {
    type: String,
    enum: ['critical', 'warning', 'info'],
    required: true,
    default: 'warning'
  },
  
  // For health condition alerts
  condition: {
    type: String,
    enum: ['diabetes', 'high_blood_pressure', 'heart_disease', 'high_cholesterol', 'kidney_disease']
  },
  
  // For food-related alerts
  foodName: String,
  nutrient: String,  // 'sugar', 'sodium', 'cholesterol', 'saturated_fat'
  amount: Number,
  threshold: Number,
  unit: String,
  
  // For deficiency alerts
  deficientNutrient: String,
  currentIntake: Number,
  recommendedIntake: Number,
  percentage: Number,
  daysBelow: Number,
  
  // Alert message and details
  message: String (required),
  details: String,
  
  // Status tracking
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: Date,
  
  // Metadata
  date: { type: Date, default: Date.now },
  createdAt: Date,
  updatedAt: Date
}
```

## 3. API Design

### 3.1 Authentication Endpoints

**POST /api/auth/register**
- Request: `{ name, email, password, age, gender, height, weight, activityLevel }`
- Response: `{ success, message, user, token }`
- Validates input, hashes password, creates user, returns JWT

**POST /api/auth/login**
- Request: `{ email, password }`
- Response: `{ success, token, user }`
- Validates credentials, generates JWT token

**GET /api/auth/profile**
- Headers: `Authorization: Bearer <token>`
- Response: `{ success, user }`
- Returns authenticated user profile

### 3.2 Food Recognition Endpoints

**POST /api/ml/analyze**
- Headers: `Authorization: Bearer <token>`, `user-id`, `user-email`
- Body: FormData with image file
- Response: `{ success, data: { nutrition, foods, analysis } }`
- Processes image with Gemini Vision API
- Returns food identification and nutrition data

**GET /api/ml/history**
- Headers: `Authorization: Bearer <token>`
- Response: `{ success, history: [...] }`
- Returns user's food recognition history

### 3.3 Tracking Endpoints

**POST /api/tracking/log**
- Headers: `Authorization: Bearer <token>`
- Body: `{ type, data, date }`
- Response: `{ success, tracking }`
- Logs meals, water, or mood entries

**GET /api/tracking/daily**
- Headers: `Authorization: Bearer <token>`
- Query: `?date=YYYY-MM-DD`
- Response: `{ success, tracking }`
- Returns daily tracking data

**DELETE /api/tracking/:id/water/:entryId**
- Headers: `Authorization: Bearer <token>`
- Response: `{ success, tracking }`
- Deletes specific water intake entry

### 3.4 Reminder Endpoints

**POST /api/reminders/test-meal**
- Body: `{ email, userName }`
- Response: `{ success, message }`
- Sends test meal reminder email

**POST /api/reminders/test-water**
- Body: `{ email, userName, currentIntake, goal }`
- Response: `{ success, message }`
- Sends test water reminder email

**POST /api/reminders/test-diet**
- Body: `{ email, userName }`
- Response: `{ success, message }`
- Sends test diet recommendation email

**POST /api/reminders/test-summary**
- Body: `{ email, userName, stats }`
- Response: `{ success, message }`
- Sends test daily summary email

### 3.5 Health Alert Endpoints

**GET /api/health/alerts/:userId**
- Response: `{ success, data: { alerts }, count }`
- Returns all active alerts for user

**GET /api/health/alerts/active/:userId**
- Response: `{ success, data: { alerts }, count }`
- Returns unacknowledged alerts only

**GET /api/health/alerts/severity/:userId/:severity**
- Response: `{ success, data: { alerts, severity }, count }`
- Returns alerts by severity (critical/warning/info)

**GET /api/health/alerts/stats/:userId**
- Response: `{ success, data: { stats } }`
- Returns alert statistics and counts

**POST /api/health/check-food**
- Body: `{ userId, foodEntry }`
- Response: `{ success, data: { alerts, hasWarnings, criticalCount } }`
- Checks food against health rules immediately

**POST /api/health/check-daily-limits**
- Body: `{ userId, date }`
- Response: `{ success, data: { alerts, date, hasViolations } }`
- Checks daily nutrient limits

**POST /api/health/check-deficiencies**
- Body: `{ userId, days }`
- Response: `{ success, data: { alerts, period, deficienciesFound } }`
- Analyzes nutrient deficiencies over time period

**POST /api/health/alerts/:alertId/acknowledge**
- Response: `{ success, data: { alert }, message }`
- Marks alert as acknowledged

**DELETE /api/health/alerts/:alertId**
- Response: `{ success, message }`
- Dismisses/deletes an alert

## 4. Component Architecture

### 4.1 Frontend Components

**Authentication Components:**
- `Login.jsx` - User login form
- `Register.jsx` - User registration form
- `EnhancedLogin.jsx` - Enhanced login with additional features
- `AuthContext.jsx` - Authentication state management

**Dashboard Components:**
- `Dashboard.jsx` - Basic dashboard layout
- `EnhancedDashboard.jsx` - Full-featured dashboard with:
  - Nutrition summary cards
  - Macronutrient charts (pie chart)
  - Water intake analytics (bar, line, pie charts)
  - Mood tracking
  - Food image upload
  - Recent meals list

**Food Components:**
- `FoodUpload.jsx` - Image upload interface
- `EnhancedFoodUpload.jsx` - Enhanced upload with preview

**Diet Planning Components:**
- `DietPlanning.jsx` - Diet plan creation
- `DietPlanningNew.jsx` - Updated diet planning interface
- `EnhancedDietPlanning.jsx` - Full-featured diet planning
- `MealPlanDisplay.jsx` - Display generated meal plans
- `CalorieCalculator.jsx` - Calculate daily calorie needs

**Layout Components:**
- `Navbar.jsx` - Navigation bar
- `LoadingSpinner.jsx` - Loading indicator

**Health Alert Components:**
- `HealthAlertBanner.jsx` - Dashboard alert summary banner
- `HealthAlertModal.jsx` - Modal for displaying food safety warnings
- `HealthAlertList.jsx` - List view of all user alerts
- `HealthAlertCard.jsx` - Individual alert display component
- `HealthConditionSelector.jsx` - Health condition selection for registration/profile
- `AlertNotification.jsx` - Toast notifications for alerts
- `AlertStatistics.jsx` - Alert analytics and trends display

### 4.2 Backend Services

**Email Service (`emailService.js`):**
- `sendMealReminder()` - Sends meal logging reminders
- `sendWaterReminder()` - Sends hydration reminders
- `sendDietRecommendation()` - Sends diet tips
- `sendDailySummary()` - Sends end-of-day summary
- Uses Nodemailer with Gmail SMTP
- HTML email templates with styling

**Gemini Service (`geminiService.js`):**
- `analyzeFood()` - Analyzes food images
- `generateDietPlan()` - Creates personalized diet plans
- Integrates with Google Gemini Vision API
- Handles image processing and nutrition extraction

**Reminder Scheduler (`reminderScheduler.js`):**
- Cron jobs for automated email sending
- Meal reminders: 8:00 AM, 12:30 PM, 7:00 PM
- Water reminders: Every 2 hours (8 AM - 6 PM)
- Diet recommendations: 9:00 AM daily
- Daily summary: 9:00 PM daily
- Smart logic: only sends if conditions met

**Python ML Services:**
- `smart_vision_analyzer.py` - Advanced food analysis
- `ml_service.py` - Machine learning integration
- `efficientnet_ml_service.py` - EfficientNet model service
- `calorie_calculator.py` - Calorie calculation logic

**Health Alert Service (`healthAlertService.js`):**
- `checkFoodForHealthRisks()` - Immediate food safety checks
- `checkDailyLimits()` - Daily nutrient limit monitoring
- `checkNutrientDeficiencies()` - Long-term deficiency analysis
- `getActiveAlerts()` - Retrieve user's active alerts
- `acknowledgeAlert()` - Mark alerts as read
- `getAlertStats()` - Alert statistics and analytics
- Integrates with health rules configuration
- Supports multiple health conditions simultaneously

## 5. Security Design

### 5.1 Authentication & Authorization

**Password Security:**
- Bcrypt hashing with salt rounds (10)
- Passwords never stored in plain text
- Password strength validation on registration

**JWT Tokens:**
- Signed with secret key
- Include user ID and email
- 7-day expiration
- Validated on protected routes

**Session Management:**
- Token stored in localStorage
- Included in Authorization header
- Validated on each API request
- Logout clears token

### 5.2 Data Protection

**Input Validation:**
- Email format validation
- Required field checks
- File type and size validation
- SQL injection prevention (MongoDB)
- XSS prevention through React

**File Upload Security:**
- File type whitelist (images only)
- File size limits (10MB)
- Secure file storage
- Unique filename generation

**API Security:**
- CORS configuration
- Rate limiting (future enhancement)
- Request size limits
- Error message sanitization

### 5.3 Privacy

**Data Access Control:**
- Users can only access their own data
- User ID from JWT token used for queries
- Authorization checks on all endpoints
- No data leakage between users

**Sensitive Data:**
- Passwords hashed
- API keys in environment variables
- Database credentials secured
- HTTPS for data transmission (production)

## 6. AI/ML Integration

### 6.1 Gemini Vision API

**Food Recognition Flow:**
1. User uploads image
2. Image sent to Gemini Vision API
3. API analyzes image and identifies foods
4. Returns food names, portions, confidence scores
5. System looks up nutrition data
6. Results displayed to user

**Prompt Engineering:**
```
Analyze this food image and provide detailed nutritional information.
For each food item visible, provide:
- Food name
- Estimated portion size
- Calories
- Protein (g)
- Carbohydrates (g)
- Fats (g)
- Confidence score

Return as JSON array.
```

**Error Handling:**
- API timeout handling
- Invalid image handling
- No food detected handling
- Fallback to manual entry

### 6.2 Nutrition Database

**Data Sources:**
- USDA FoodData Central
- Custom food database
- CSV file with Pakistani meals
- Gemini AI knowledge base

**Calculation Logic:**
- Base nutrition per 100g
- Portion size adjustment
- Rounding to 1 decimal place
- Aggregation for multiple foods

## 7. Email System Design

### 7.1 Email Configuration

**SMTP Settings:**
- Service: Gmail
- Host: smtp.gmail.com
- Port: 587
- Secure: false (STARTTLS)
- Auth: aimenm861@gmail.com / App Password

**Email Templates:**
- HTML with inline CSS
- Responsive design
- Brand colors and styling
- Clear call-to-action buttons

### 7.2 Reminder Logic

**Meal Reminders:**
- Check if meal logged for time period
- Only send if not logged
- Include motivational message
- Link to dashboard

**Water Reminders:**
- Check current water intake
- Only send if below 80% of goal
- Show current progress
- Encourage hydration

**Diet Recommendations:**
- Personalized based on user profile
- Include actionable tips
- Reference user goals
- Sent once daily

**Daily Summary:**
- Aggregate day's data
- Calculate totals and percentages
- Show goal progress
- Provide encouragement

### 7.3 Scheduling

**Cron Expressions:**
- Breakfast: `0 8 * * *` (8:00 AM)
- Lunch: `30 12 * * *` (12:30 PM)
- Dinner: `0 19 * * *` (7:00 PM)
- Water: `0 8,10,12,14,16,18 * * *` (Every 2 hours)
- Diet: `0 9 * * *` (9:00 AM)
- Summary: `0 21 * * *` (9:00 PM)

**Timezone Handling:**
- Server timezone used
- Future: user timezone preferences
- Consistent scheduling across users

## 8. Data Visualization

### 8.1 Dashboard Charts

**Macronutrient Pie Chart:**
- Shows protein, carbs, fats distribution
- Color-coded segments
- Percentage labels
- Interactive hover tooltips

**Water Intake Bar Chart:**
- Compares consumed vs goal
- Color-coded (blue for water, gray for goal)
- Shows exact values
- Visual progress indicator

**Water Timeline Line Chart:**
- X-axis: Time of day
- Y-axis: Water amount (ml)
- Two lines: per-entry and cumulative
- Interactive hover with details

**Water Distribution Pie Chart:**
- Shows intake distribution throughout day
- Each entry as segment
- Time labels
- Amount in ml

### 8.2 Chart Libraries

**Recharts Components:**
- `PieChart` with `Pie` and `Cell`
- `BarChart` with `Bar`
- `LineChart` with `Line`
- `ResponsiveContainer` for responsive sizing
- `Tooltip` for interactive details
- `Legend` for chart keys

**Styling:**
- Custom colors matching brand
- Responsive sizing
- Mobile-friendly
- Accessible labels

## 9. Performance Considerations

### 9.1 Frontend Optimization

**Code Splitting:**
- Lazy loading for routes
- Component-level code splitting
- Reduced initial bundle size

**State Management:**
- Context API for global state
- Local state for component-specific data
- Minimal re-renders

**Asset Optimization:**
- Image compression
- Lazy loading images
- Optimized bundle size

### 9.2 Backend Optimization

**Database Queries:**
- Indexed fields (userId, email, date)
- Projection to limit returned fields
- Aggregation pipelines for complex queries
- Connection pooling

**Caching:**
- Future: Redis for session storage
- Future: API response caching
- Future: Static asset caching

**API Performance:**
- Async/await for non-blocking operations
- Error handling to prevent crashes
- Request validation to reduce processing

### 9.3 External API Management

**Gemini API:**
- Timeout handling (30 seconds)
- Retry logic for failures
- Rate limiting awareness
- Error fallback mechanisms

**Email Service:**
- Queue for bulk sending (future)
- Async sending to avoid blocking
- Error logging for failed sends
- Retry mechanism for transient failures

## 10. Error Handling

### 10.1 Frontend Error Handling

**User-Facing Errors:**
- Toast notifications for errors
- Clear error messages
- Recovery suggestions
- Form validation feedback

**Error Boundaries:**
- Catch React component errors
- Graceful degradation
- Error reporting (future)

### 10.2 Backend Error Handling

**API Errors:**
- Consistent error response format
- HTTP status codes
- Error logging
- Stack traces in development only

**Database Errors:**
- Connection error handling
- Query error handling
- Transaction rollback
- Data validation errors

**External Service Errors:**
- Gemini API failures
- Email service failures
- Timeout handling
- Fallback mechanisms

## 11. Testing Strategy

### 11.1 Unit Tests

**Frontend:**
- Component rendering tests
- User interaction tests
- State management tests
- Utility function tests

**Backend:**
- Route handler tests
- Service function tests
- Model validation tests
- Utility function tests

### 11.2 Integration Tests

**API Integration:**
- End-to-end API flow tests
- Authentication flow tests
- Data persistence tests
- External service integration tests

### 11.3 Property-Based Tests

**Correctness Properties:**
- User registration uniqueness
- Password security
- Authentication token validity
- Image upload validation
- Food recognition consistency
- Nutrition calculation accuracy
- Data storage integrity
- Dashboard data consistency

## 12. Deployment

### 12.1 Environment Configuration

**Environment Variables:**
```
# Database
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=...

# Gemini API
GEMINI_API_KEY=...

# Email
EMAIL_USER=aimenm861@gmail.com
EMAIL_APP_PASSWORD=youptmllwmqmrxeg
EMAIL_FROM=NutriOptima <aimenm861@gmail.com>

# Server
PORT=5001
NODE_ENV=production
```

### 12.2 Production Considerations

**Security:**
- HTTPS enforcement
- Environment variable protection
- API key rotation
- Security headers

**Monitoring:**
- Error logging
- Performance monitoring
- Uptime monitoring
- User analytics

**Backup:**
- Database backups
- Configuration backups
- Disaster recovery plan

## 13. Future Enhancements

### 13.1 Planned Features

- User timezone preferences
- Customizable reminder times
- Advanced analytics and insights
- Social features (meal sharing)
- Barcode scanning
- Recipe database
- Meal planning automation
- Integration with fitness trackers

### 13.2 Technical Improvements

- Redis caching layer
- GraphQL API
- Real-time updates with WebSockets
- Progressive Web App (PWA)
- Mobile native apps
- Microservices architecture
- Kubernetes deployment
- CI/CD pipeline

## 14. Correctness Properties

### Property 1: User Registration Uniqueness
**Validates: Requirements 1.2**

For all registration attempts with email E:
- If user with email E exists, registration fails
- If user with email E does not exist, registration succeeds
- After successful registration, exactly one user with email E exists

### Property 2: Password Security
**Validates: Requirements 1.4**

For all passwords P:
- Stored password ≠ P (never plain text)
- Hash(P) is deterministic for same P
- Hash(P1) ≠ Hash(P2) for P1 ≠ P2 (with high probability)
- Verification(P, Hash(P)) = true

### Property 3: Authentication Token Validity
**Validates: Requirements 2.3**

For all valid tokens T:
- T contains user identification
- T has expiration time
- Expired tokens rejected
- Tampered tokens rejected
- Valid tokens grant access

### Property 4: Image Upload Validation
**Validates: Requirements 3.4**

For all uploaded files F:
- If F is not an image, upload rejected
- If F exceeds size limit, upload rejected
- If F is valid image, upload accepted
- Accepted files stored securely

### Property 5: Food Recognition Consistency
**Validates: Requirements 3.2, 3.3**

For all food images I:
- Recognition returns result or error
- Result includes food names and confidence
- Same image produces consistent results
- Errors handled gracefully

### Property 6: Nutrition Calculation Accuracy
**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

For all food items F with portion P:
- Calories(F, P) = BaseCalories(F) × P
- Macros(F, P) = BaseMacros(F) × P
- Total = Sum of all items
- Values are non-negative

### Property 7: Data Storage Integrity
**Validates: Requirements 4.5**

For all data entries D:
- D associated with correct user
- D persists after storage
- D retrievable by user
- D not accessible by other users

### Property 8: Dashboard Data Consistency
**Validates: Requirements 5.1, 5.2, 5.3**

For all dashboard displays:
- Totals = Sum of individual entries
- Percentages sum to 100%
- Progress = Current / Goal
- Data updates reflect immediately
### Property 9: Health Alert Generation Accuracy
**Validates: Requirements 11.1, 11.2**

For all food entries F and users U with health conditions H:
- If F violates any rule in H, alert is generated
- If F does not violate any rule in H, no alert is generated
- Alert severity matches rule severity
- Alert contains accurate nutrient values and thresholds
- All generated alerts are saved to database

### Property 10: Health Condition Rule Enforcement
**Validates: Requirements 11.2**

For all health conditions C and nutrients N:
- Rules are consistently applied across all food entries
- Threshold violations always trigger appropriate alerts
- Multiple conditions are handled simultaneously
- Rule changes take effect immediately

### Property 11: Alert Acknowledgment Integrity
**Validates: Requirements 11.6**

For all alerts A and acknowledgment actions:
- Acknowledged alerts remain acknowledged
- Acknowledgment timestamp is recorded
- Only alert owner can acknowledge
- Acknowledged alerts excluded from active alert queries

### Property 12: Daily Limit Tracking Accuracy
**Validates: Requirements 11.3**

For all users U and nutrients N on date D:
- Daily total = Sum of all food entries for D
- Limit violations detected when total > threshold
- Alerts generated only when limits exceeded
- Daily totals reset at midnight

### Property 13: Nutrient Deficiency Detection Consistency
**Validates: Requirements 11.4**

For all users U and time periods T:
- Average intake calculated correctly over T
- RDA standards applied based on user demographics
- Deficiency alerts generated when intake < threshold for sufficient days
- Severity levels assigned correctly based on percentage of RDA
## 15. Admin Panel System Design

### 15.1 Admin Panel Architecture

**Admin Frontend:**
- Separate React.js application for admin interface
- Material-UI or Ant Design for professional admin components
- Role-based component rendering and route protection
- Real-time updates using WebSocket connections
- Responsive design for desktop and tablet access

**Admin Backend:**
- Dedicated admin API routes with enhanced security
- Role-based middleware for permission checking
- Admin action logging and audit trail system
- Rate limiting and IP whitelisting for admin endpoints
- Separate admin authentication system with MFA

### 15.2 Admin Data Models

#### Admin User Model
```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  passwordHash: String (required),
  role: {
    type: String,
    enum: ['super_admin', 'content_admin', 'support_admin', 'data_admin'],
    required: true
  },
  permissions: [String], // Granular permissions array
  mfaEnabled: { type: Boolean, default: false },
  mfaSecret: String,
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  ipWhitelist: [String],
  isActive: { type: Boolean, default: true },
  createdBy: ObjectId (ref: AdminUser),
  createdAt: Date,
  updatedAt: Date
}
```

#### Admin Action Log Model
```javascript
{
  _id: ObjectId,
  adminId: ObjectId (ref: AdminUser, required),
  adminEmail: String (required),
  action: String (required), // 'user_edit', 'user_block', 'food_update', etc.
  targetType: String (required), // 'user', 'food_item', 'health_alert', etc.
  targetId: ObjectId,
  details: {
    before: Object, // State before action
    after: Object,  // State after action
    reason: String, // Admin's reason for action
    metadata: Object // Additional context
  },
  ipAddress: String,
  userAgent: String,
  timestamp: { type: Date, default: Date.now },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  }
}
```

#### System Issue Model
```javascript
{
  _id: ObjectId,
  reportedBy: ObjectId (ref: User), // User who reported the issue
  assignedTo: ObjectId (ref: AdminUser),
  category: {
    type: String,
    enum: ['technical', 'content', 'account', 'health', 'data_quality', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed', 'escalated'],
    default: 'open'
  },
  title: String (required),
  description: String (required),
  steps: String, // Steps to reproduce
  expectedBehavior: String,
  actualBehavior: String,
  attachments: [String], // File URLs
  comments: [{
    authorId: ObjectId,
    authorType: { type: String, enum: ['user', 'admin'] },
    content: String,
    timestamp: Date,
    isInternal: Boolean // Internal admin notes
  }],
  resolution: String,
  tags: [String],
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date,
  closedAt: Date
}
```

#### Food Database Enhancement Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  category: String,
  brand: String,
  barcode: String,
  nutrition: {
    // Macronutrients per 100g
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
    fiber: Number,
    sugar: Number,
    sodium: Number,
    cholesterol: Number,
    saturatedFat: Number,
    transFat: Number,
    
    // Micronutrients per 100g
    vitaminA: Number,
    vitaminC: Number,
    vitaminD: Number,
    vitaminE: Number,
    vitaminK: Number,
    vitaminB12: Number,
    folate: Number,
    calcium: Number,
    iron: Number,
    magnesium: Number,
    potassium: Number,
    zinc: Number
  },
  servingSize: String,
  servingWeight: Number, // grams
  images: [String], // Image URLs
  aliases: [String], // Alternative names
  verified: { type: Boolean, default: false },
  verifiedBy: ObjectId (ref: AdminUser),
  verifiedAt: Date,
  source: {
    type: String,
    enum: ['usda', 'admin', 'user_contributed', 'api_import'],
    default: 'admin'
  },
  contributedBy: ObjectId (ref: User),
  moderationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  moderatedBy: ObjectId (ref: AdminUser),
  moderatedAt: Date,
  moderationNotes: String,
  version: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  createdAt: Date,
  updatedAt: Date
}
```

### 15.3 Admin API Endpoints

#### Authentication & Authorization
```
POST /api/admin/auth/login
POST /api/admin/auth/logout
POST /api/admin/auth/refresh
POST /api/admin/auth/setup-mfa
POST /api/admin/auth/verify-mfa
GET  /api/admin/auth/profile
PUT  /api/admin/auth/profile
POST /api/admin/auth/change-password
```

#### User Management
```
GET    /api/admin/users
GET    /api/admin/users/:id
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
POST   /api/admin/users/:id/block
POST   /api/admin/users/:id/unblock
POST   /api/admin/users/:id/reset-password
GET    /api/admin/users/:id/activity
GET    /api/admin/users/:id/health-alerts
GET    /api/admin/users/:id/food-logs
POST   /api/admin/users/bulk-action
GET    /api/admin/users/export
```

#### Food Database Management
```
GET    /api/admin/foods
POST   /api/admin/foods
PUT    /api/admin/foods/:id
DELETE /api/admin/foods/:id
POST   /api/admin/foods/bulk-import
GET    /api/admin/foods/pending-moderation
POST   /api/admin/foods/:id/approve
POST   /api/admin/foods/:id/reject
GET    /api/admin/foods/export
POST   /api/admin/foods/validate-nutrition
```

#### Content Moderation
```
GET    /api/admin/images/pending
POST   /api/admin/images/:id/approve
POST   /api/admin/images/:id/reject
GET    /api/admin/user-submissions
POST   /api/admin/user-submissions/:id/moderate
GET    /api/admin/content-reports
```

#### System Analytics
```
GET /api/admin/analytics/dashboard
GET /api/admin/analytics/users
GET /api/admin/analytics/engagement
GET /api/admin/analytics/system-health
GET /api/admin/analytics/food-recognition
GET /api/admin/analytics/health-alerts
POST /api/admin/reports/generate
GET /api/admin/reports/:id
```

#### Issue Management
```
GET    /api/admin/issues
POST   /api/admin/issues
GET    /api/admin/issues/:id
PUT    /api/admin/issues/:id
POST   /api/admin/issues/:id/assign
POST   /api/admin/issues/:id/comment
POST   /api/admin/issues/:id/resolve
GET    /api/admin/issues/stats
```

#### System Management
```
GET  /api/admin/system/health
GET  /api/admin/system/logs
POST /api/admin/system/backup
GET  /api/admin/system/backups
POST /api/admin/system/restore
GET  /api/admin/system/config
PUT  /api/admin/system/config
POST /api/admin/notifications/broadcast
```

#### Audit & Logging
```
GET /api/admin/audit-logs
GET /api/admin/audit-logs/search
GET /api/admin/audit-logs/export
GET /api/admin/admin-actions
```

### 15.4 Admin Panel Components

#### Dashboard Components
- `AdminDashboard.jsx` - Main admin dashboard with key metrics
- `SystemHealthWidget.jsx` - Real-time system status indicators
- `UserStatsWidget.jsx` - User engagement and growth metrics
- `AlertSummaryWidget.jsx` - Health alert system overview
- `RecentActivityFeed.jsx` - Latest admin actions and system events

#### User Management Components
- `UserList.jsx` - Paginated user list with search and filters
- `UserDetail.jsx` - Detailed user profile view and editing
- `UserActions.jsx` - User management actions (block, delete, etc.)
- `UserActivityTimeline.jsx` - User's activity history and logs
- `BulkUserActions.jsx` - Batch operations for multiple users

#### Content Management Components
- `FoodDatabase.jsx` - Food database browser and editor
- `FoodEditor.jsx` - Add/edit food items with nutrition data
- `ImageModerationQueue.jsx` - Review user-uploaded images
- `ContentReports.jsx` - User-reported content issues
- `BulkImport.jsx` - CSV/Excel food data import interface

#### Analytics Components
- `AnalyticsDashboard.jsx` - Comprehensive analytics overview
- `UserEngagementCharts.jsx` - User activity and retention charts
- `SystemPerformanceCharts.jsx` - API performance and error rates
- `HealthAlertAnalytics.jsx` - Health alert patterns and effectiveness
- `ReportBuilder.jsx` - Custom report generation interface

#### System Management Components
- `SystemLogs.jsx` - System log viewer with filtering
- `BackupManager.jsx` - Backup and restore interface
- `ConfigurationPanel.jsx` - System settings management
- `NotificationCenter.jsx` - Broadcast notifications and alerts
- `AuditTrail.jsx` - Admin action logs and audit trail

### 15.5 Security Implementation

#### Authentication Security
- Separate admin authentication system from regular users
- Multi-factor authentication using TOTP (Time-based One-Time Password)
- Strong password requirements with complexity validation
- Account lockout after failed login attempts
- IP whitelisting for additional security layer

#### Authorization & Permissions
- Role-based access control (RBAC) with granular permissions
- Permission middleware for all admin API endpoints
- Dynamic permission checking based on admin role
- Audit logging for all permission checks and access attempts

#### Data Protection
- All admin actions logged with full context and audit trail
- Sensitive data encryption at rest and in transit
- Secure session management with short timeout periods
- CSRF protection for all state-changing operations
- Input validation and sanitization for all admin inputs

### 15.6 Performance Considerations

#### Frontend Optimization
- Code splitting for admin panel to reduce initial load time
- Lazy loading of admin components and routes
- Efficient data fetching with pagination and caching
- Real-time updates using WebSocket connections
- Responsive design optimized for desktop and tablet use

#### Backend Optimization
- Database indexing for admin queries (user searches, audit logs)
- Caching for frequently accessed admin data
- Rate limiting for admin API endpoints
- Async processing for bulk operations
- Query optimization for large dataset operations

### 15.7 Monitoring and Alerting

#### System Monitoring
- Real-time monitoring of admin panel performance
- Alert system for critical admin actions
- Monitoring of admin login patterns and suspicious activity
- Performance metrics for admin API endpoints
- Database performance monitoring for admin queries

#### Security Monitoring
- Failed login attempt monitoring and alerting
- Unusual admin activity pattern detection
- Privilege escalation attempt monitoring
- Data access pattern analysis
- Security incident response procedures

### 15.8 Correctness Properties for Admin Panel

#### Property 14: Admin Access Control
**Validates: Requirements 12.1**

For all admin users A and actions X:
- If A lacks permission for X, access is denied
- If A has permission for X, access is granted
- All access attempts are logged
- Expired sessions are rejected

#### Property 15: Admin Action Auditability
**Validates: Requirements 12.12**

For all admin actions A:
- A is logged with complete context
- Log entry is immutable after creation
- Log includes admin ID, timestamp, and action details
- Logs are searchable and exportable

#### Property 16: Data Integrity in Admin Operations
**Validates: Requirements 12.2, 12.3**

For all admin data modifications M:
- M preserves data consistency
- M includes validation checks
- M can be rolled back if necessary
- M is logged with before/after states

#### Property 17: User Privacy in Admin Access
**Validates: Requirements 12.2**

For all user data access by admin A:
- A can only access data within their permission scope
- Access is logged for audit purposes
- Sensitive data is properly masked when appropriate
- User consent requirements are respected where applicable