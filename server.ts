import crypto from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type {
  AdminCanteenMetrics,
  Canteen,
  CanteenId,
  FoodCategory,
  MenuItem,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  UserProfile,
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'campus-bites-db.json');
const UPLOADS_DIR = path.resolve(__dirname, 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface StoredUser extends UserProfile {
  passwordHash: string;
  passwordSalt: string;
}

interface StoredAdmin {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
}

interface DatabaseSchema {
  canteens: Canteen[];
  menuItems: MenuItem[];
  users: StoredUser[];
  adminAccount: StoredAdmin | null;
  orders: Order[];
  orderSequence: number;
}

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');

const VALID_CANTEEN_IDS: CanteenId[] = ['block-2', 'apple-bees'];
const VALID_CATEGORIES: FoodCategory[] = [
  'Breakfast',
  'Snacks',
  'Fast Food',
  'Main Course',
  'Beverages',
  'Desserts',
];
const VALID_STATUSES: OrderStatus[] = [
  'Order Placed',
  'Order Accepted',
  'Preparing Your Food',
  'Ready for Pickup',
  'Completed',
  'Cancelled',
  'Rejected',
];

function createSeedDatabase(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    canteens: [
      {
        id: 'block-2',
        name: 'Block 2 Canteen',
        tagline: 'Classic Campus Kitchen & Tiffin Hall',
        description:
          'Freshly cooked South Indian breakfasts, hot parathas, crispy chaat, and hearty North Indian bowls at student-friendly prices.',
        location: 'Ground Floor, Academic Block 2',
        timings: '7:30 AM – 7:30 PM',
        avgPrepMinutes: 12,
        image: '/src/assets/images/canteen_block2_1795200116788.jpg',
        upiId: 'block2canteen@okicici',
        upiMerchantName: 'Block 2 Canteen Campus Bites',
        isOpen: true,
      },
      {
        id: 'apple-bees',
        name: 'Apple & Bees Canteen',
        tagline: 'Modern Campus Café & Grill',
        description:
          'Hand-crafted gourmet burgers, creamy pastas, grilled kathi wraps, Belgian cold coffee, and warm bakery desserts.',
        location: 'Student Activity Courtyard',
        timings: '8:30 AM – 9:00 PM',
        avgPrepMinutes: 15,
        image: '/src/assets/images/canteen_apple_bees_1795200116907.jpg',
        upiId: 'applebees.campus@okhdfcbank',
        upiMerchantName: 'Apple and Bees Cafe',
        isOpen: true,
      },
    ],
    menuItems: [
      // Block 2 Canteen
      {
        id: 'b2-masala-dosa',
        canteenId: 'block-2',
        name: 'Crispy Masala Dosa',
        description: 'Golden fermented crepe stuffed with spiced potato masala, served with coconut chutney and steaming sambar.',
        price: 65,
        category: 'Breakfast',
        isVeg: true,
        available: true,
        prepTimeMinutes: 10,
        image: '/src/assets/images/food_masala_dosa_1795200117322.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-indori-poha',
        canteenId: 'block-2',
        name: 'Indori Sev Poha',
        description: 'Fluffy flattened rice tempered with mustard seeds, curry leaves, roasted peanuts, pomegranate, and crispy Ratlami sev.',
        price: 40,
        category: 'Breakfast',
        isVeg: true,
        available: true,
        prepTimeMinutes: 6,
        image: '/src/assets/images/food_poha_breakfast_1795200118143.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-punjabi-samosa',
        canteenId: 'block-2',
        name: 'Punjabi Samosa Plate (2 Pcs)',
        description: 'Flaky golden pastry triangles filled with spiced potatoes and green peas, served with mint and tamarind chutneys.',
        price: 35,
        category: 'Snacks',
        isVeg: true,
        available: true,
        prepTimeMinutes: 5,
        image: '/src/assets/images/food_samosa_chaat_1795200117036.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-paneer-roll',
        canteenId: 'block-2',
        name: 'Paneer Tikka Kathi Roll',
        description: 'Char-grilled cottage cheese cubes, pickled red onions, and mint mayo wrapped in a flaky whole-wheat paratha.',
        price: 95,
        category: 'Fast Food',
        isVeg: true,
        available: true,
        prepTimeMinutes: 12,
        image: '/src/assets/images/food_paneer_roll_1795200117443.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-chicken-roll',
        canteenId: 'block-2',
        name: 'Double Egg Chicken Roll',
        description: 'Juicy tandoori chicken strips layered over a fluffy spiced egg paratha with crunchy onions and chaat masala.',
        price: 120,
        category: 'Fast Food',
        isVeg: false,
        available: true,
        prepTimeMinutes: 14,
        image: '/src/assets/images/food_paneer_roll_1795200117443.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-rajma-chawal',
        canteenId: 'block-2',
        name: 'Homestyle Rajma Chawal & Naan',
        description: 'Slow-simmered red kidney bean curry served with fragrant jeera basmati rice, butter naan, and pickled onions.',
        price: 110,
        category: 'Main Course',
        isVeg: true,
        available: true,
        prepTimeMinutes: 12,
        image: '/src/assets/images/food_thali_rajma_1795200117100.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-paneer-thali',
        canteenId: 'block-2',
        name: 'Paneer Butter Masala Bowl',
        description: 'Rich tomato-cashew makhani gravy with soft paneer cubes, jeera rice, and two crispy butter garlic naans.',
        price: 140,
        category: 'Main Course',
        isVeg: true,
        available: true,
        prepTimeMinutes: 15,
        image: '/src/assets/images/food_thali_rajma_1795200117100.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-kulhad-chai',
        canteenId: 'block-2',
        name: 'Adrak Elaichi Kulhad Chai',
        description: 'Freshly brewed Assam tea infused with crushed ginger and green cardamom, served piping hot in an earthen kulhad.',
        price: 25,
        category: 'Beverages',
        isVeg: true,
        available: true,
        prepTimeMinutes: 4,
        image: '/src/assets/images/food_cold_coffee_1795200116907.jpg',
        updatedAt: now,
      },
      {
        id: 'b2-brownie-bite',
        canteenId: 'block-2',
        name: 'Warm Chocolate Walnut Brownie',
        description: 'Fudgy dark chocolate bakery brownie studded with toasted walnuts and warm fudge drizzle.',
        price: 60,
        category: 'Desserts',
        isVeg: true,
        available: true,
        prepTimeMinutes: 5,
        image: '/src/assets/images/food_chocolate_brownie_1795200116878.jpg',
        updatedAt: now,
      },

      // Apple & Bees Canteen
      {
        id: 'ab-breakfast-poha',
        canteenId: 'apple-bees',
        name: 'Citrus Peanut Breakfast Poha',
        description: 'Light café-style spiced poha finished with toasted peanuts, ruby pomegranate, fresh cilantro, and lime.',
        price: 55,
        category: 'Breakfast',
        isVeg: true,
        available: true,
        prepTimeMinutes: 8,
        image: '/src/assets/images/food_poha_breakfast_1795200118143.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-ghee-dosa',
        canteenId: 'apple-bees',
        name: 'Butter Roast Dosa Platter',
        description: 'Extra-crisp butter-roasted dosa filled with herb-infused potato mash, two chutneys, and sambar.',
        price: 85,
        category: 'Breakfast',
        isVeg: true,
        available: true,
        prepTimeMinutes: 12,
        image: '/src/assets/images/food_masala_dosa_1795200117322.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-samosa-trio',
        canteenId: 'apple-bees',
        name: 'Crispy Herb Samosa Trio',
        description: 'Three golden cocktail samosas paired with house-blended mint coriander dip and tangy tamarind glaze.',
        price: 50,
        category: 'Snacks',
        isVeg: true,
        available: true,
        prepTimeMinutes: 7,
        image: '/src/assets/images/food_samosa_chaat_1795200117036.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-crispy-chicken-burger',
        canteenId: 'apple-bees',
        name: 'Crispy Fried Chicken Burger & Fries',
        description: 'Buttermilk-brined crunchy chicken fillet, aged cheddar, crisp lettuce, and smoky chipotle mayo in a brioche bun with peri-peri fries.',
        price: 165,
        category: 'Fast Food',
        isVeg: false,
        available: true,
        prepTimeMinutes: 16,
        image: '/src/assets/images/food_crispy_burger_1795200116524.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-veg-crunch-burger',
        canteenId: 'apple-bees',
        name: 'Herb Cheese Crispy Burger',
        description: 'Golden herb-crusted vegetable & paneer patty with melted cheddar, crisp greens, and salted fries.',
        price: 135,
        category: 'Fast Food',
        isVeg: true,
        available: true,
        prepTimeMinutes: 14,
        image: '/src/assets/images/food_crispy_burger_1795200116524.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-arrabbiata-pasta',
        canteenId: 'apple-bees',
        name: 'Roasted Tomato Arrabbiata Penne',
        description: 'Al dente penne tossed in slow-roasted cherry tomato basil sauce with parmesan and two toasted garlic herb breads.',
        price: 155,
        category: 'Main Course',
        isVeg: true,
        available: true,
        prepTimeMinutes: 15,
        image: '/src/assets/images/food_margherita_pasta_1795200116461.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-chicken-pasta',
        canteenId: 'apple-bees',
        name: 'Smoked Chicken Pink Sauce Pasta',
        description: 'Creamy spiced tomato-alfredo penne loaded with grilled chicken strips, olives, basil, and garlic bread.',
        price: 185,
        category: 'Main Course',
        isVeg: false,
        available: true,
        prepTimeMinutes: 17,
        image: '/src/assets/images/food_margherita_pasta_1795200116461.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-paneer-wrap',
        canteenId: 'apple-bees',
        name: 'Smoky Peri-Peri Paneer Wrap',
        description: 'Charred cottage cheese strips, crisp veggies, and zesty herb dressing rolled in a toasted flatbread.',
        price: 115,
        category: 'Snacks',
        isVeg: true,
        available: true,
        prepTimeMinutes: 11,
        image: '/src/assets/images/food_paneer_roll_1795200117443.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-belgian-cold-coffee',
        canteenId: 'apple-bees',
        name: 'Belgian Dark Cold Coffee',
        description: 'Double-shot arabica espresso blended with chilled milk, velvety ice cream, and dark cocoa drizzle.',
        price: 85,
        category: 'Beverages',
        isVeg: true,
        available: true,
        prepTimeMinutes: 5,
        image: '/src/assets/images/food_cold_coffee_1795200116907.jpg',
        updatedAt: now,
      },
      {
        id: 'ab-brownie-sundae',
        canteenId: 'apple-bees',
        name: 'Sizzling Brownie & Vanilla Scoop',
        description: 'Warm chocolate walnut brownie crowned with Madagascar vanilla bean ice cream and molten fudge.',
        price: 110,
        category: 'Desserts',
        isVeg: true,
        available: true,
        prepTimeMinutes: 7,
        image: '/src/assets/images/food_chocolate_brownie_1795200116878.jpg',
        updatedAt: now,
      },
    ],
    users: [],
    adminAccount: null,
    orders: [],
    orderSequence: 1040,
  };
}

function loadDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_FILE)) {
    const seeded = createSeedDatabase();
    saveDatabase(seeded);
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    if (!parsed.canteens || !parsed.menuItems) {
      const seeded = createSeedDatabase();
      saveDatabase(seeded);
      return seeded;
    }
    return parsed;
  } catch {
    const seeded = createSeedDatabase();
    saveDatabase(seeded);
    return seeded;
  }
}

function saveDatabase(db: DatabaseSchema): void {
  const tempFile = `${DB_FILE}.${crypto.randomBytes(6).toString('hex')}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempFile, DB_FILE);
}

let db = loadDatabase();

function hashPassword(password: string, existingSalt?: string): { hash: string; salt: string } {
  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return { hash: derived, salt };
}

function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuffer = Buffer.from(storedHash, 'hex');
  if (derived.length !== storedBuffer.length) return false;
  return crypto.timingSafeEqual(derived, storedBuffer);
}

function safeCompareStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a).digest();
  const hashB = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

interface TokenPayload {
  sub: string;
  role: 'student' | 'admin';
  exp: number;
}

function signToken(userId: string, role: 'student' | 'admin'): string {
  const payload: TokenPayload = {
    sub: userId,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const encoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [encoded, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(encoded).digest('base64url');
  if (!safeCompareStrings(sig, expectedSig)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8')) as TokenPayload;
    if (!payload.sub || !payload.role || typeof payload.exp !== 'number') return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

interface AuthenticatedRequest extends Request {
  authUser?: UserProfile;
}

function parseBearerUser(req: Request): UserProfile | null {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length).trim();
  const payload = verifyToken(token);
  if (!payload) return null;

  if (payload.role === 'admin') {
    if (payload.sub === 'env-admin' && process.env.ADMIN_PASSCODE) {
      return {
        id: 'env-admin',
        role: 'admin',
        fullName: 'Canteen Administrator',
        email: 'admin@campusbites.edu',
        createdAt: new Date().toISOString(),
      };
    }
    if (db.adminAccount && db.adminAccount.id === payload.sub) {
      return {
        id: db.adminAccount.id,
        role: 'admin',
        fullName: db.adminAccount.fullName,
        email: db.adminAccount.email,
        createdAt: db.adminAccount.createdAt,
      };
    }
    return null;
  }

  const student = db.users.find((u) => u.id === payload.sub);
  if (!student) return null;
  return {
    id: student.id,
    role: 'student',
    fullName: student.fullName,
    rollNumber: student.rollNumber,
    email: student.email,
    mobileNumber: student.mobileNumber,
    createdAt: student.createdAt,
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = parseBearerUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.authUser = user;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const user = parseBearerUser(req);
  if (!user || user.role !== 'admin') {
    res.status(403).json({ error: 'Administrator privileges required.' });
    return;
  }
  req.authUser = user;
  next();
}

// Server-Sent Events subscribers for real-time order updates
const sseClients = new Set<Response>();

function broadcastOrderEvent(order: Order): void {
  const payload = JSON.stringify({
    type: 'ORDER_UPDATE',
    orderId: order.id,
    canteenId: order.canteenId,
    status: order.status,
    updatedAt: order.updatedAt,
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function isNonEmptyString(val: unknown, maxLen = 200): val is string {
  return typeof val === 'string' && val.trim().length > 0 && val.trim().length <= maxLen;
}

function sanitizeImageUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('/src/assets/images/') || trimmed.startsWith('/uploads/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
  } catch {
    return null;
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Serve uploaded food images safely
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  // --- Canteens ---
  app.get('/api/canteens', (_req, res) => {
    res.json({ canteens: db.canteens });
  });

  app.patch('/api/canteens/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const canteenId = req.params.id as CanteenId;
    const canteen = db.canteens.find((c) => c.id === canteenId);
    if (!canteen) {
      res.status(404).json({ error: 'Canteen not found.' });
      return;
    }
    const { upiId, upiMerchantName, isOpen, avgPrepMinutes, timings } = req.body ?? {};
    if (upiId !== undefined) {
      if (!isNonEmptyString(upiId, 80) || !upiId.includes('@')) {
        res.status(400).json({ error: 'Valid UPI ID is required (e.g. name@bank).' });
        return;
      }
      canteen.upiId = upiId.trim();
    }
    if (upiMerchantName !== undefined && isNonEmptyString(upiMerchantName, 80)) {
      canteen.upiMerchantName = upiMerchantName.trim();
    }
    if (typeof isOpen === 'boolean') {
      canteen.isOpen = isOpen;
    }
    if (typeof avgPrepMinutes === 'number' && Number.isFinite(avgPrepMinutes) && avgPrepMinutes >= 1 && avgPrepMinutes <= 120) {
      canteen.avgPrepMinutes = Math.round(avgPrepMinutes);
    }
    if (timings !== undefined && isNonEmptyString(timings, 60)) {
      canteen.timings = timings.trim();
    }
    saveDatabase(db);
    res.json({ canteen });
  });

  // --- Menu Items ---
  app.get('/api/menu', (req, res) => {
    const canteenId = req.query.canteenId;
    if (canteenId && typeof canteenId === 'string') {
      if (!VALID_CANTEEN_IDS.includes(canteenId as CanteenId)) {
        res.status(400).json({ error: 'Invalid canteen ID.' });
        return;
      }
      res.json({ items: db.menuItems.filter((item) => item.canteenId === canteenId) });
      return;
    }
    res.json({ items: db.menuItems });
  });

  app.post('/api/menu', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { canteenId, name, description, price, category, isVeg, available, prepTimeMinutes, image } = req.body ?? {};
    if (!VALID_CANTEEN_IDS.includes(canteenId)) {
      res.status(400).json({ error: 'Invalid canteen selected.' });
      return;
    }
    if (!isNonEmptyString(name, 80)) {
      res.status(400).json({ error: 'Food name is required (max 80 characters).' });
      return;
    }
    if (!isNonEmptyString(description, 260)) {
      res.status(400).json({ error: 'Description is required (max 260 characters).' });
      return;
    }
    const numericPrice = Number(price);
    if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 5000) {
      res.status(400).json({ error: 'Price must be between ₹1 and ₹5000.' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'Invalid category.' });
      return;
    }
    const safeImg =
      sanitizeImageUrl(image) || '/src/assets/images/food_samosa_chaat_1795200117036.jpg';
    const prep = Number(prepTimeMinutes);
    const newItem: MenuItem = {
      id: `${canteenId === 'block-2' ? 'b2' : 'ab'}-${crypto.randomUUID().slice(0, 8)}`,
      canteenId,
      name: name.trim(),
      description: description.trim(),
      price: Math.round(numericPrice),
      category,
      isVeg: Boolean(isVeg),
      available: available !== false,
      prepTimeMinutes: Number.isFinite(prep) && prep >= 1 && prep <= 90 ? Math.round(prep) : 10,
      image: safeImg,
      updatedAt: new Date().toISOString(),
    };
    db.menuItems.unshift(newItem);
    saveDatabase(db);
    res.status(201).json({ item: newItem });
  });

  app.patch('/api/menu/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const item = db.menuItems.find((m) => m.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Menu item not found.' });
      return;
    }
    const { name, description, price, category, isVeg, available, prepTimeMinutes, image } = req.body ?? {};
    if (name !== undefined) {
      if (!isNonEmptyString(name, 80)) {
        res.status(400).json({ error: 'Valid name is required.' });
        return;
      }
      item.name = name.trim();
    }
    if (description !== undefined) {
      if (!isNonEmptyString(description, 260)) {
        res.status(400).json({ error: 'Valid description is required.' });
        return;
      }
      item.description = description.trim();
    }
    if (price !== undefined) {
      const numericPrice = Number(price);
      if (!Number.isFinite(numericPrice) || numericPrice <= 0 || numericPrice > 5000) {
        res.status(400).json({ error: 'Price must be between ₹1 and ₹5000.' });
        return;
      }
      item.price = Math.round(numericPrice);
    }
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        res.status(400).json({ error: 'Invalid category.' });
        return;
      }
      item.category = category;
    }
    if (typeof isVeg === 'boolean') item.isVeg = isVeg;
    if (typeof available === 'boolean') item.available = available;
    if (prepTimeMinutes !== undefined) {
      const prep = Number(prepTimeMinutes);
      if (Number.isFinite(prep) && prep >= 1 && prep <= 90) {
        item.prepTimeMinutes = Math.round(prep);
      }
    }
    if (image !== undefined) {
      const safeImg = sanitizeImageUrl(image);
      if (!safeImg) {
        res.status(400).json({ error: 'Invalid image path or URL.' });
        return;
      }
      item.image = safeImg;
    }
    item.updatedAt = new Date().toISOString();
    saveDatabase(db);
    res.json({ item });
  });

  app.delete('/api/menu/:id', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const idx = db.menuItems.findIndex((m) => m.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'Menu item not found.' });
      return;
    }
    db.menuItems.splice(idx, 1);
    saveDatabase(db);
    res.json({ ok: true });
  });

  // --- Admin Image Upload ---
  app.post('/api/upload', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const { dataUrl } = req.body ?? {};
    if (typeof dataUrl !== 'string') {
      res.status(400).json({ error: 'Image dataUrl is required.' });
      return;
    }
    const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'Only PNG, JPEG, or WebP images are supported.' });
      return;
    }
    const mime = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 2.5 * 1024 * 1024) {
      res.status(400).json({ error: 'Image size must be under 2.5 MB.' });
      return;
    }
    const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
    const safeName = `dish-${crypto.randomUUID()}.${ext}`;
    const resolvedPath = path.resolve(UPLOADS_DIR, safeName);
    if (!resolvedPath.startsWith(UPLOADS_DIR + path.sep)) {
      res.status(400).json({ error: 'Invalid upload destination.' });
      return;
    }
    fs.writeFileSync(resolvedPath, buffer);
    res.status(201).json({ url: `/uploads/${safeName}` });
  });

  // --- Auth Endpoints ---
  app.get('/api/auth/status', (_req, res) => {
    res.json({
      adminClaimed: Boolean(db.adminAccount),
      envPasscodeConfigured: Boolean(process.env.ADMIN_PASSCODE && process.env.ADMIN_PASSCODE.trim().length > 0),
    });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    res.json({ user: req.authUser });
  });

  app.post('/api/auth/register', (req, res) => {
    const { fullName, rollNumber, email, mobileNumber, password } = req.body ?? {};
    if (!isNonEmptyString(fullName, 80)) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }
    if (!isNonEmptyString(rollNumber, 30)) {
      res.status(400).json({ error: 'College roll number is required.' });
      return;
    }
    if (!isNonEmptyString(email, 120) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Valid email address is required.' });
      return;
    }
    if (!isNonEmptyString(mobileNumber, 20) || !/^[0-9+\-\s]{8,16}$/.test(mobileNumber.trim())) {
      res.status(400).json({ error: 'Valid 10-digit mobile number is required.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
      res.status(400).json({ error: 'Password must be at least 6 characters.' });
      return;
    }

    const normEmail = email.trim().toLowerCase();
    const normRoll = rollNumber.trim().toUpperCase();

    if (db.users.some((u) => u.email === normEmail)) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }
    if (db.users.some((u) => (u.rollNumber || '').toUpperCase() === normRoll)) {
      res.status(409).json({ error: 'This college roll number is already registered.' });
      return;
    }

    const { hash, salt } = hashPassword(password);
    const newUser: StoredUser = {
      id: `stu-${crypto.randomUUID().slice(0, 10)}`,
      role: 'student',
      fullName: fullName.trim(),
      rollNumber: normRoll,
      email: normEmail,
      mobileNumber: mobileNumber.trim(),
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };
    db.users.push(newUser);
    saveDatabase(db);

    const publicUser: UserProfile = {
      id: newUser.id,
      role: 'student',
      fullName: newUser.fullName,
      rollNumber: newUser.rollNumber,
      email: newUser.email,
      mobileNumber: newUser.mobileNumber,
      createdAt: newUser.createdAt,
    };
    const token = signToken(newUser.id, 'student');
    res.status(201).json({ user: publicUser, token });
  });

  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body ?? {};
    if (!isNonEmptyString(identifier, 120) || typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Email/Roll Number and password are required.' });
      return;
    }
    const cleanId = identifier.trim();
    const student = db.users.find(
      (u) => u.email === cleanId.toLowerCase() || (u.rollNumber || '').toUpperCase() === cleanId.toUpperCase()
    );
    if (!student || !verifyPassword(password, student.passwordHash, student.passwordSalt)) {
      res.status(401).json({ error: 'Invalid email/roll number or password.' });
      return;
    }
    const publicUser: UserProfile = {
      id: student.id,
      role: 'student',
      fullName: student.fullName,
      rollNumber: student.rollNumber,
      email: student.email,
      mobileNumber: student.mobileNumber,
      createdAt: student.createdAt,
    };
    const token = signToken(student.id, 'student');
    res.json({ user: publicUser, token });
  });

  app.post('/api/auth/admin/claim', (req, res) => {
    const envPass = process.env.ADMIN_PASSCODE?.trim();
    if (envPass) {
      res.status(403).json({ error: 'Admin passcode is already managed via server environment.' });
      return;
    }
    if (db.adminAccount) {
      res.status(403).json({ error: 'Admin account has already been claimed. Please sign in.' });
      return;
    }
    const { fullName, email, password } = req.body ?? {};
    if (!isNonEmptyString(fullName, 80)) {
      res.status(400).json({ error: 'Admin name is required.' });
      return;
    }
    if (!isNonEmptyString(email, 120) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Valid admin email is required.' });
      return;
    }
    if (typeof password !== 'string' || password.length < 6 || password.length > 100) {
      res.status(400).json({ error: 'Admin password must be at least 6 characters.' });
      return;
    }
    const { hash, salt } = hashPassword(password);
    const admin: StoredAdmin = {
      id: `adm-${crypto.randomUUID().slice(0, 8)}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      passwordHash: hash,
      passwordSalt: salt,
      createdAt: new Date().toISOString(),
    };
    db.adminAccount = admin;
    saveDatabase(db);

    const publicAdmin: UserProfile = {
      id: admin.id,
      role: 'admin',
      fullName: admin.fullName,
      email: admin.email,
      createdAt: admin.createdAt,
    };
    const token = signToken(admin.id, 'admin');
    res.status(201).json({ user: publicAdmin, token });
  });

  app.post('/api/auth/admin/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof password !== 'string' || password.length === 0) {
      res.status(400).json({ error: 'Admin password is required.' });
      return;
    }
    const envPass = process.env.ADMIN_PASSCODE?.trim();
    if (envPass && safeCompareStrings(password, envPass)) {
      const publicAdmin: UserProfile = {
        id: 'env-admin',
        role: 'admin',
        fullName: 'Canteen Administrator',
        email: typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : 'admin@campusbites.edu',
        createdAt: new Date().toISOString(),
      };
      const token = signToken('env-admin', 'admin');
      res.json({ user: publicAdmin, token });
      return;
    }
    if (db.adminAccount) {
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      if (
        cleanEmail === db.adminAccount.email &&
        verifyPassword(password, db.adminAccount.passwordHash, db.adminAccount.passwordSalt)
      ) {
        const publicAdmin: UserProfile = {
          id: db.adminAccount.id,
          role: 'admin',
          fullName: db.adminAccount.fullName,
          email: db.adminAccount.email,
          createdAt: db.adminAccount.createdAt,
        };
        const token = signToken(db.adminAccount.id, 'admin');
        res.json({ user: publicAdmin, token });
        return;
      }
    }
    res.status(401).json({ error: 'Invalid administrator credentials.' });
  });

  // --- Orders & Real-Time SSE ---
  app.get('/api/orders/stream', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
    res.write(`data: ${JSON.stringify({ type: 'CONNECTED' })}\n\n`);

    sseClients.add(res);
    const keepAlive = setInterval(() => {
      try {
        res.write(': ping\n\n');
      } catch {
        clearInterval(keepAlive);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  app.post('/api/orders', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const authUser = req.authUser!;
    const {
      canteenId,
      studentName,
      rollNumber,
      mobileNumber,
      items,
      pickupTime,
      paymentMethod,
      upiTransactionRef,
      notes,
    } = req.body ?? {};

    if (!VALID_CANTEEN_IDS.includes(canteenId)) {
      res.status(400).json({ error: 'Please select a valid canteen.' });
      return;
    }
    const canteen = db.canteens.find((c) => c.id === canteenId);
    if (!canteen || !canteen.isOpen) {
      res.status(400).json({ error: 'Selected canteen is currently not accepting pre-orders.' });
      return;
    }
    if (!isNonEmptyString(studentName, 80) || !isNonEmptyString(rollNumber, 30) || !isNonEmptyString(mobileNumber, 20)) {
      res.status(400).json({ error: 'Student name, roll number, and mobile number are required.' });
      return;
    }
    if (!isNonEmptyString(pickupTime, 60)) {
      res.status(400).json({ error: 'Preferred pickup time is required.' });
      return;
    }
    const validPayment: PaymentMethod = paymentMethod === 'UPI' ? 'UPI' : 'Cash';
    if (!Array.isArray(items) || items.length === 0 || items.length > 30) {
      res.status(400).json({ error: 'Cart must contain between 1 and 30 items.' });
      return;
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;
    let maxPrepTime = canteen.avgPrepMinutes;

    for (const rawItem of items) {
      if (!rawItem || typeof rawItem.menuItemId !== 'string') {
        res.status(400).json({ error: 'Invalid cart item format.' });
        return;
      }
      const qty = Number(rawItem.quantity);
      if (!Number.isInteger(qty) || qty < 1 || qty > 25) {
        res.status(400).json({ error: 'Item quantity must be between 1 and 25.' });
        return;
      }
      const menuItem = db.menuItems.find((m) => m.id === rawItem.menuItemId);
      if (!menuItem) {
        res.status(404).json({ error: 'One or more ordered items no longer exist.' });
        return;
      }
      if (menuItem.canteenId !== canteenId) {
        res.status(400).json({ error: 'Items from two different canteens cannot be combined in one order.' });
        return;
      }
      if (!menuItem.available) {
        res.status(400).json({ error: `"${menuItem.name}" is currently unavailable.` });
        return;
      }
      orderItems.push({
        menuItemId: menuItem.id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: qty,
        isVeg: menuItem.isVeg,
        image: menuItem.image,
      });
      subtotal += menuItem.price * qty;
      if (menuItem.prepTimeMinutes > maxPrepTime) {
        maxPrepTime = menuItem.prepTimeMinutes;
      }
    }

    db.orderSequence += 1;
    const prefix = canteenId === 'block-2' ? 'CB-B2' : 'CB-AB';
    const orderId = `${prefix}-${db.orderSequence}`;
    const now = new Date().toISOString();

    const newOrder: Order = {
      id: orderId,
      canteenId,
      canteenName: canteen.name,
      userId: authUser.id,
      studentName: studentName.trim(),
      rollNumber: rollNumber.trim().toUpperCase(),
      mobileNumber: mobileNumber.trim(),
      items: orderItems,
      subtotal,
      totalAmount: subtotal,
      pickupTime: pickupTime.trim(),
      paymentMethod: validPayment,
      upiTransactionRef:
        validPayment === 'UPI' && typeof upiTransactionRef === 'string' && upiTransactionRef.trim()
          ? upiTransactionRef.trim().slice(0, 60)
          : undefined,
      status: 'Order Placed',
      estimatedPrepMinutes: maxPrepTime,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim().slice(0, 200) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.orders.unshift(newOrder);
    saveDatabase(db);
    broadcastOrderEvent(newOrder);
    res.status(201).json({ order: newOrder });
  });

  app.get('/api/orders/mine', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const myOrders = db.orders.filter((o) => o.userId === req.authUser!.id);
    res.json({ orders: myOrders });
  });

  app.get('/api/orders/track/:orderId', (req, res) => {
    const cleanId = req.params.orderId.trim().toUpperCase();
    const order = db.orders.find((o) => o.id.toUpperCase() === cleanId);
    if (!order) {
      res.status(404).json({ error: `Order "${cleanId}" was not found.` });
      return;
    }
    const requester = parseBearerUser(req);
    const isOwnerOrAdmin = requester && (requester.role === 'admin' || requester.id === order.userId);
    if (isOwnerOrAdmin) {
      res.json({ order, canCancel: order.status === 'Order Placed' });
      return;
    }
    // Redact mobile number for unauthenticated or non-owner lookups
    const sanitizedOrder: Order = {
      ...order,
      mobileNumber: '••••••••••',
    };
    res.json({ order: sanitizedOrder, canCancel: false });
  });

  app.post('/api/orders/:orderId/cancel', requireAuth, (req: AuthenticatedRequest, res: Response) => {
    const cleanId = req.params.orderId.trim().toUpperCase();
    const order = db.orders.find((o) => o.id.toUpperCase() === cleanId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const requester = req.authUser!;
    if (requester.role !== 'admin' && order.userId !== requester.id) {
      res.status(403).json({ error: 'You can only cancel your own orders.' });
      return;
    }
    if (order.status !== 'Order Placed') {
      res.status(400).json({ error: 'Orders can only be cancelled before preparation begins.' });
      return;
    }
    order.status = 'Cancelled';
    order.updatedAt = new Date().toISOString();
    saveDatabase(db);
    broadcastOrderEvent(order);
    res.json({ order });
  });

  app.get('/api/orders/admin/:canteenId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const canteenId = req.params.canteenId as CanteenId;
    if (!VALID_CANTEEN_IDS.includes(canteenId)) {
      res.status(400).json({ error: 'Invalid canteen ID.' });
      return;
    }
    const canteenOrders = db.orders.filter((o) => o.canteenId === canteenId);
    const todayKey = new Date().toISOString().slice(0, 10);

    const validSalesOrders = canteenOrders.filter(
      (o) => o.status !== 'Cancelled' && o.status !== 'Rejected'
    );
    const todaySalesOrders = validSalesOrders.filter((o) => o.createdAt.slice(0, 10) === todayKey);

    const metrics: AdminCanteenMetrics = {
      canteenId,
      todayOrders: todaySalesOrders.length,
      todayRevenue: todaySalesOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      totalOrders: validSalesOrders.length,
      totalRevenue: validSalesOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      activeOrders: canteenOrders.filter((o) =>
        ['Order Placed', 'Order Accepted', 'Preparing Your Food', 'Ready for Pickup'].includes(o.status)
      ).length,
      completedOrders: canteenOrders.filter((o) => o.status === 'Completed').length,
    };

    res.json({ orders: canteenOrders, metrics });
  });

  app.patch('/api/orders/:orderId/status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
    const cleanId = req.params.orderId.trim().toUpperCase();
    const order = db.orders.find((o) => o.id.toUpperCase() === cleanId);
    if (!order) {
      res.status(404).json({ error: 'Order not found.' });
      return;
    }
    const { status } = req.body ?? {};
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'Invalid order status.' });
      return;
    }
    order.status = status;
    order.updatedAt = new Date().toISOString();
    saveDatabase(db);
    broadcastOrderEvent(order);
    res.json({ order });
  });

  // --- Frontend Serving (Vite dev middleware or built dist/) ---
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(__dirname, 'dist', 'index.html'));
  if (isProd) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Campus Bites server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start Campus Bites server:', err);
  process.exit(1);
});
