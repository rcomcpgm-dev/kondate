import type { MealSelection, MealPlan, Recipe, Genre, Mood, Rarity, Difficulty, GentleOption } from '../types';
import { rollRarity } from '../constants/rarity';
import { DIET_CALORIE_TARGET } from '../constants/options';

// High-purine ingredients to avoid for gout
const HIGH_PURINE_INGREDIENTS = [
  'むきエビ', 'エビ', 'レバー', '干物', 'いわし', 'かつお',
  'サバ切り身', 'アジ', 'ビール', '豚レバー', '牛レバー',
];

// ============================================================
// Mock recipe database
// ============================================================

type MainRecipe = Recipe & { genres: Genre[]; moods: Mood[]; difficulty: Difficulty; gentle?: boolean };

const MAIN_RECIPES: MainRecipe[] = [
  {
    name: '鶏の照り焼き',
    description: '甘辛いタレが絡んだジューシーな鶏もも肉の照り焼き',
    rarity: 'N',
    ingredients: [
      { name: '鶏もも肉', amount: '2枚（500g）' },
      { name: '醤油', amount: '大さじ3' },
      { name: 'みりん', amount: '大さじ3' },
      { name: '酒', amount: '大さじ2' },
      { name: '砂糖', amount: '大さじ1' },
      { name: 'サラダ油', amount: '大さじ1' },
    ],
    steps: [
      '鶏もも肉をフォークで数カ所刺し、味を染み込みやすくする',
      'フライパンにサラダ油を熱し、鶏肉を皮目から中火で焼く',
      '皮がパリッとしたら裏返し、蓋をして5分蒸し焼きにする',
      '醤油・みりん・酒・砂糖を混ぜたタレを加え、煮絡める',
      '照りが出たら火を止め、食べやすい大きさに切って盛り付ける',
    ],
    cookingTimeMinutes: 20,
    calories: 380,
    nutrition: { calories: 380, protein: 28, fat: 18, carbs: 22, fiber: 0.5, salt: 2.8 },
    difficulty: 'beginner',
    gentle: true,
    genres: ['japanese'],
    moods: ['hearty', 'rich', 'sweet'],
  },
  {
    name: '豚の生姜焼き',
    description: '生姜の風味が食欲をそそる定番の豚肉料理',
    rarity: 'N',
    ingredients: [
      { name: '豚ロース薄切り', amount: '300g' },
      { name: '玉ねぎ', amount: '1個' },
      { name: '生姜（すりおろし）', amount: '大さじ1' },
      { name: '醤油', amount: '大さじ2' },
      { name: 'みりん', amount: '大さじ1' },
      { name: '酒', amount: '大さじ1' },
    ],
    steps: [
      '玉ねぎを薄切りにする',
      '豚肉に醤油・みりん・酒・生姜を揉み込み10分漬ける',
      'フライパンで玉ねぎを炒め、しんなりしたら取り出す',
      '同じフライパンで豚肉を広げて焼く',
      '玉ねぎを戻し、タレを絡めて仕上げる',
    ],
    cookingTimeMinutes: 20,
    calories: 350,
    nutrition: { calories: 350, protein: 22, fat: 20, carbs: 18, fiber: 1.2, salt: 2.5 },
    difficulty: 'beginner',
    genres: ['japanese'],
    moods: ['hearty', 'spicy'],
  },
  {
    name: '麻婆豆腐',
    description: '花椒の痺れとピリ辛が癖になる本格麻婆豆腐',
    rarity: 'R',
    ingredients: [
      { name: '絹豆腐', amount: '1丁（400g）' },
      { name: '豚ひき肉', amount: '150g' },
      { name: '長ねぎ', amount: '1本' },
      { name: '豆板醤', amount: '大さじ1' },
      { name: '甜麺醤', amount: '大さじ1' },
      { name: '鶏がらスープ', amount: '200ml' },
      { name: '花椒', amount: '小さじ1' },
      { name: '片栗粉', amount: '大さじ1' },
    ],
    steps: [
      '豆腐を2cm角に切り、熱湯で2分茹でて水切りする',
      '長ねぎをみじん切りにする',
      'フライパンで豚ひき肉を炒め、豆板醤・甜麺醤を加える',
      '鶏がらスープを加えて煮立て、豆腐を入れる',
      '水溶き片栗粉でとろみをつけ、花椒を振って仕上げる',
    ],
    cookingTimeMinutes: 25,
    calories: 320,
    nutrition: { calories: 320, protein: 20, fat: 18, carbs: 16, fiber: 1.8, salt: 3.2 },
    difficulty: 'normal',
    genres: ['chinese'],
    moods: ['spicy', 'hearty'],
  },
  {
    name: 'ハンバーグ',
    description: 'ふっくらジューシーな手作りハンバーグ',
    rarity: 'SR',
    ingredients: [
      { name: '合いびき肉', amount: '400g' },
      { name: '玉ねぎ', amount: '1個' },
      { name: 'パン粉', amount: '1/2カップ' },
      { name: '牛乳', amount: '大さじ3' },
      { name: '卵', amount: '1個' },
      { name: 'ケチャップ', amount: '大さじ3' },
      { name: 'ウスターソース', amount: '大さじ2' },
    ],
    steps: [
      '玉ねぎをみじん切りにし、飴色になるまで炒めて冷ます',
      'パン粉を牛乳で湿らせる',
      'ひき肉・玉ねぎ・パン粉・卵を粘りが出るまでよく混ぜる',
      '小判型に成形し、中央をくぼませる',
      'フライパンで両面を焼き、蓋をして蒸し焼きにする',
      'ケチャップとウスターソースでソースを作り、かける',
    ],
    cookingTimeMinutes: 40,
    calories: 450,
    nutrition: { calories: 450, protein: 25, fat: 28, carbs: 24, fiber: 1.0, salt: 2.2 },
    difficulty: 'advanced',
    genres: ['western'],
    moods: ['hearty', 'rich'],
  },
  {
    name: 'チキン南蛮',
    description: '甘酢とタルタルソースが絶品の宮崎名物',
    rarity: 'SR',
    ingredients: [
      { name: '鶏むね肉', amount: '2枚' },
      { name: '卵', amount: '3個' },
      { name: '小麦粉', amount: '適量' },
      { name: '酢', amount: '大さじ3' },
      { name: '砂糖', amount: '大さじ2' },
      { name: '醤油', amount: '大さじ2' },
      { name: 'マヨネーズ', amount: '大さじ4' },
      { name: 'らっきょう', amount: '4個' },
    ],
    steps: [
      '鶏むね肉を一口大のそぎ切りにし、塩胡椒する',
      '小麦粉をまぶし、溶き卵にくぐらせて揚げ焼きにする',
      '酢・砂糖・醤油を合わせた甘酢ダレに揚げたチキンを漬ける',
      'ゆで卵・マヨネーズ・刻みらっきょうでタルタルを作る',
      'チキンにタルタルソースをたっぷりかけて盛り付ける',
    ],
    cookingTimeMinutes: 35,
    calories: 520,
    nutrition: { calories: 520, protein: 30, fat: 28, carbs: 35, fiber: 0.8, salt: 2.8 },
    difficulty: 'advanced',
    genres: ['japanese', 'western'],
    moods: ['hearty', 'rich', 'sweet'],
  },
  {
    name: '回鍋肉（ホイコーロー）',
    description: 'キャベツと豚肉の甘辛味噌炒め',
    rarity: 'R',
    ingredients: [
      { name: '豚バラ薄切り', amount: '250g' },
      { name: 'キャベツ', amount: '1/4個' },
      { name: 'ピーマン', amount: '2個' },
      { name: '甜麺醤', amount: '大さじ2' },
      { name: '豆板醤', amount: '小さじ1' },
      { name: '醤油', amount: '大さじ1' },
      { name: 'にんにく', amount: '1片' },
    ],
    steps: [
      'キャベツをざく切り、ピーマンを乱切りにする',
      '豚バラ肉を一口大に切る',
      'フライパンでにんにくを炒め、豚肉を加えて炒める',
      '野菜を加えて強火で炒める',
      '甜麺醤・豆板醤・醤油を加えて手早く炒め合わせる',
    ],
    cookingTimeMinutes: 15,
    calories: 380,
    nutrition: { calories: 380, protein: 18, fat: 24, carbs: 20, fiber: 2.5, salt: 3.0 },
    difficulty: 'beginner',
    genres: ['chinese'],
    moods: ['hearty', 'spicy', 'salty'],
  },
  {
    name: 'ガパオライス',
    description: 'バジルの香りとナンプラーが効いたタイ風ひき肉炒め',
    rarity: 'R',
    ingredients: [
      { name: '鶏ひき肉', amount: '300g' },
      { name: 'バジルの葉', amount: '20枚' },
      { name: '赤パプリカ', amount: '1個' },
      { name: 'にんにく', amount: '2片' },
      { name: '唐辛子', amount: '1本' },
      { name: 'ナンプラー', amount: '大さじ2' },
      { name: 'オイスターソース', amount: '大さじ1' },
      { name: '卵', amount: '人数分' },
    ],
    steps: [
      'にんにくと唐辛子をみじん切りにする',
      'パプリカを1cm角に切る',
      'フライパンでにんにく・唐辛子を炒め、ひき肉を加える',
      'パプリカを加え、ナンプラー・オイスターソースで味付け',
      'バジルの葉を加えてさっと炒める',
      '目玉焼きを作り、ごはんの上にガパオと目玉焼きを盛る',
    ],
    cookingTimeMinutes: 15,
    calories: 450,
    nutrition: { calories: 450, protein: 24, fat: 20, carbs: 42, fiber: 1.5, salt: 3.5 },
    difficulty: 'beginner',
    genres: ['ethnic'],
    moods: ['spicy', 'hearty'],
  },
  {
    name: 'ビビンバ',
    description: 'ごま油香るナムルと甘辛肉の韓国混ぜごはん',
    rarity: 'SR',
    ingredients: [
      { name: '牛ひき肉', amount: '200g' },
      { name: 'ほうれん草', amount: '1束' },
      { name: 'もやし', amount: '1袋' },
      { name: 'にんじん', amount: '1本' },
      { name: 'コチュジャン', amount: '大さじ2' },
      { name: 'ごま油', amount: '大さじ2' },
      { name: '卵黄', amount: '人数分' },
    ],
    steps: [
      '牛ひき肉をコチュジャン・醤油・砂糖で炒める',
      'ほうれん草を茹でてごま油と塩で和える',
      'もやしを茹でてナムルにする',
      'にんじんを千切りにしてごま油で炒める',
      '熱々のごはんの上にナムル・肉・卵黄を盛り、混ぜて食べる',
    ],
    cookingTimeMinutes: 30,
    calories: 550,
    nutrition: { calories: 550, protein: 25, fat: 22, carbs: 60, fiber: 3.5, salt: 3.0 },
    difficulty: 'normal',
    genres: ['korean'],
    moods: ['hearty', 'spicy'],
  },
  {
    name: 'サバの味噌煮',
    description: '味噌の甘みが染み込んだ定番の魚料理',
    rarity: 'R',
    ingredients: [
      { name: 'サバ切り身', amount: '4切れ' },
      { name: '味噌', amount: '大さじ3' },
      { name: '砂糖', amount: '大さじ2' },
      { name: '酒', amount: '100ml' },
      { name: 'みりん', amount: '大さじ2' },
      { name: '生姜', amount: '1片' },
    ],
    steps: [
      'サバに十字の切り込みを入れ、熱湯をかけて臭みを取る',
      '鍋に酒・水・砂糖・薄切り生姜を入れて煮立てる',
      'サバを入れ、落とし蓋をして10分煮る',
      '味噌を溶き入れ、さらに5分煮る',
      '煮汁をスプーンでかけながら照りを出す',
    ],
    cookingTimeMinutes: 25,
    calories: 280,
    nutrition: { calories: 280, protein: 22, fat: 14, carbs: 16, fiber: 0.3, salt: 2.8 },
    difficulty: 'normal',
    gentle: true,
    genres: ['japanese'],
    moods: ['rich', 'sweet', 'healthy'],
  },
  {
    name: 'グリーンカレー',
    description: 'ココナッツミルクのまろやかさとスパイシーなタイカレー',
    rarity: 'SSR',
    ingredients: [
      { name: '鶏もも肉', amount: '300g' },
      { name: 'グリーンカレーペースト', amount: '大さじ2' },
      { name: 'ココナッツミルク', amount: '400ml' },
      { name: 'なす', amount: '2本' },
      { name: 'バジルの葉', amount: '10枚' },
      { name: 'ナンプラー', amount: '大さじ1' },
      { name: '砂糖', amount: '小さじ1' },
    ],
    steps: [
      '鶏肉を一口大に切り、なすを乱切りにする',
      '鍋にココナッツミルクの上澄みを熱し、カレーペーストを炒める',
      '鶏肉を加えて炒め、残りのココナッツミルクを加える',
      'なすを加えて煮込み、ナンプラーと砂糖で味を調える',
      'バジルを加えてひと煮立ちさせ、ごはんと一緒に盛る',
    ],
    cookingTimeMinutes: 25,
    calories: 480,
    nutrition: { calories: 480, protein: 22, fat: 30, carbs: 28, fiber: 2.0, salt: 2.5 },
    difficulty: 'advanced',
    genres: ['ethnic'],
    moods: ['spicy', 'rich'],
  },
  {
    name: 'チーズタッカルビ',
    description: 'とろ〜りチーズと甘辛ダレの鶏肉野菜炒め',
    rarity: 'SR',
    ingredients: [
      { name: '鶏もも肉', amount: '400g' },
      { name: 'キャベツ', amount: '1/4個' },
      { name: 'さつまいも', amount: '1本' },
      { name: 'コチュジャン', amount: '大さじ3' },
      { name: '醤油', amount: '大さじ1' },
      { name: 'ピザ用チーズ', amount: '200g' },
    ],
    steps: [
      '鶏肉を一口大に切り、コチュジャン・醤油・砂糖で漬ける',
      'キャベツをざく切り、さつまいもを薄切りにする',
      'フライパンで鶏肉と野菜を炒める',
      '火が通ったら中央を開け、チーズを入れる',
      'チーズが溶けたら絡めながら食べる',
    ],
    cookingTimeMinutes: 25,
    calories: 520,
    nutrition: { calories: 520, protein: 30, fat: 28, carbs: 32, fiber: 2.0, salt: 3.2 },
    difficulty: 'normal',
    genres: ['korean'],
    moods: ['hearty', 'rich'],
  },
  {
    name: 'アジの南蛮漬け',
    description: 'さっぱり酢で仕上げた揚げアジの夏向き一品',
    rarity: 'R',
    ingredients: [
      { name: 'アジ（三枚おろし）', amount: '4尾分' },
      { name: '玉ねぎ', amount: '1個' },
      { name: 'にんじん', amount: '1/2本' },
      { name: '酢', amount: '100ml' },
      { name: '醤油', amount: '大さじ2' },
      { name: '砂糖', amount: '大さじ2' },
      { name: '唐辛子', amount: '1本' },
    ],
    steps: [
      '南蛮酢を作る：酢・醤油・砂糖・唐辛子を合わせる',
      '玉ねぎ・にんじんを薄切りにして南蛮酢に漬ける',
      'アジに塩胡椒・片栗粉をまぶす',
      '170℃の油でカラッと揚げる',
      '揚げたてを南蛮酢に漬け、30分以上味を馴染ませる',
    ],
    cookingTimeMinutes: 40,
    calories: 290,
    nutrition: { calories: 290, protein: 20, fat: 12, carbs: 24, fiber: 1.5, salt: 2.5 },
    difficulty: 'advanced',
    genres: ['japanese'],
    moods: ['refreshing', 'healthy'],
  },
  {
    name: 'オムライス',
    description: 'ケチャップライスをふわとろ卵で包んだ洋食の定番',
    rarity: 'SR',
    ingredients: [
      { name: '鶏もも肉', amount: '150g' },
      { name: '玉ねぎ', amount: '1/2個' },
      { name: 'ごはん', amount: '2膳分' },
      { name: 'ケチャップ', amount: '大さじ4' },
      { name: '卵', amount: '4個' },
      { name: 'バター', amount: '20g' },
      { name: '牛乳', amount: '大さじ2' },
    ],
    steps: [
      '鶏肉を小さめの一口大に切り、玉ねぎをみじん切りにする',
      'フライパンでバターを溶かし、鶏肉と玉ねぎを炒める',
      'ごはんを加えてケチャップで味付けし、皿に盛る',
      '卵に牛乳を加えて溶き、バターを溶かしたフライパンで半熟に焼く',
      'ケチャップライスの上にふわとろ卵をのせ、ケチャップで仕上げ',
    ],
    cookingTimeMinutes: 20,
    calories: 580,
    nutrition: { calories: 580, protein: 22, fat: 24, carbs: 65, fiber: 1.0, salt: 2.8 },
    difficulty: 'normal',
    genres: ['western'],
    moods: ['sweet', 'rich'],
  },
  {
    name: 'サーモンのムニエル',
    description: 'バターの風味豊かなサーモンの定番洋食',
    rarity: 'SR',
    ingredients: [
      { name: '生サーモン', amount: '2切れ' },
      { name: '小麦粉', amount: '適量' },
      { name: 'バター', amount: '30g' },
      { name: 'レモン', amount: '1/2個' },
      { name: '塩胡椒', amount: '適量' },
      { name: 'パセリ', amount: '適量' },
    ],
    steps: [
      'サーモンに塩胡椒をし、小麦粉を薄くまぶす',
      'フライパンにバターを溶かし、サーモンを中火で焼く',
      '片面3分ずつ、こんがり焼き色をつける',
      'レモン汁をかけ、刻みパセリを散らす',
      '付け合わせの野菜と一緒に盛り付ける',
    ],
    cookingTimeMinutes: 15,
    calories: 320,
    nutrition: { calories: 320, protein: 24, fat: 20, carbs: 8, fiber: 0.2, salt: 1.5 },
    difficulty: 'beginner',
    genres: ['western'],
    moods: ['refreshing', 'healthy'],
  },
  {
    name: '肉じゃが',
    description: 'ほっくりじゃがいもと牛肉の甘辛煮込み',
    rarity: 'N',
    ingredients: [
      { name: '牛薄切り肉', amount: '200g' },
      { name: 'じゃがいも', amount: '3個' },
      { name: '玉ねぎ', amount: '1個' },
      { name: 'にんじん', amount: '1本' },
      { name: 'しらたき', amount: '1袋' },
      { name: '醤油', amount: '大さじ3' },
      { name: 'みりん', amount: '大さじ2' },
      { name: '砂糖', amount: '大さじ1' },
    ],
    steps: [
      'じゃがいも・にんじんを乱切り、玉ねぎをくし切りにする',
      '鍋で牛肉を炒め、野菜を加えてさらに炒める',
      'だし汁を加え、醤油・みりん・砂糖で味付けする',
      'しらたきを加え、落とし蓋をして20分煮込む',
      'じゃがいもが柔らかくなったら火を止め、味を含ませる',
    ],
    cookingTimeMinutes: 40,
    calories: 380,
    nutrition: { calories: 380, protein: 18, fat: 16, carbs: 40, fiber: 3.0, salt: 2.8 },
    difficulty: 'normal',
    gentle: true,
    genres: ['japanese'],
    moods: ['hearty', 'sweet'],
  },
  {
    name: 'エビチリ',
    description: 'ぷりぷりエビの甘辛チリソース',
    rarity: 'R',
    ingredients: [
      { name: 'むきエビ', amount: '300g' },
      { name: '長ねぎ', amount: '1本' },
      { name: 'にんにく', amount: '1片' },
      { name: '生姜', amount: '1片' },
      { name: 'ケチャップ', amount: '大さじ3' },
      { name: '豆板醤', amount: '小さじ1' },
      { name: '片栗粉', amount: '大さじ1' },
    ],
    steps: [
      'エビに酒と片栗粉をまぶして下味をつける',
      'ねぎ・にんにく・生姜をみじん切りにする',
      'フライパンで香味野菜を炒め、エビを加えて炒める',
      'ケチャップ・豆板醤・砂糖・酢を合わせたソースを加える',
      '水溶き片栗粉でとろみをつけて仕上げる',
    ],
    cookingTimeMinutes: 20,
    calories: 250,
    nutrition: { calories: 250, protein: 22, fat: 10, carbs: 18, fiber: 1.0, salt: 2.8 },
    difficulty: 'normal',
    genres: ['chinese'],
    moods: ['spicy', 'sweet'],
  },
  {
    name: 'プルコギ',
    description: '甘辛い醤油ダレで漬け込んだ韓国風焼肉',
    rarity: 'R',
    ingredients: [
      { name: '牛薄切り肉', amount: '300g' },
      { name: '玉ねぎ', amount: '1個' },
      { name: 'にんじん', amount: '1/2本' },
      { name: 'ニラ', amount: '1束' },
      { name: '醤油', amount: '大さじ3' },
      { name: 'コチュジャン', amount: '大さじ1' },
      { name: 'ごま油', amount: '大さじ1' },
      { name: '梨（すりおろし）', amount: '1/4個' },
    ],
    steps: [
      '醤油・コチュジャン・ごま油・梨・にんにくでタレを作る',
      '牛肉をタレに30分漬け込む',
      '玉ねぎは薄切り、にんじんは千切り、ニラは5cm幅に切る',
      'フライパンで肉と野菜を強火で炒める',
      '仕上げにごまを振って盛り付ける',
    ],
    cookingTimeMinutes: 20,
    calories: 420,
    nutrition: { calories: 420, protein: 24, fat: 22, carbs: 28, fiber: 2.0, salt: 3.0 },
    difficulty: 'normal',
    genres: ['korean'],
    moods: ['hearty', 'sweet', 'salty'],
  },
  {
    name: '鮭の塩焼き',
    description: 'シンプルだけど間違いない朝食の定番',
    rarity: 'N',
    ingredients: [
      { name: '塩鮭切り身', amount: '人数分' },
      { name: '大根おろし', amount: '適量' },
      { name: 'レモン', amount: '1/4個' },
    ],
    steps: [
      '鮭の水分をキッチンペーパーで拭き取る',
      'グリルを中火で予熱する',
      '皮目を上にして7〜8分焼く',
      '裏返して3〜4分焼く',
      '大根おろしとレモンを添えて盛り付ける',
    ],
    cookingTimeMinutes: 15,
    calories: 180,
    nutrition: { calories: 180, protein: 22, fat: 8, carbs: 2, fiber: 0.5, salt: 1.8 },
    difficulty: 'beginner',
    gentle: true,
    genres: ['japanese'],
    moods: ['refreshing', 'healthy', 'salty'],
  },
  {
    name: 'パッタイ',
    description: 'タマリンドの甘酸っぱさが効いたタイ風焼きそば',
    rarity: 'SSR',
    ingredients: [
      { name: 'センレック（米麺）', amount: '200g' },
      { name: 'むきエビ', amount: '150g' },
      { name: 'もやし', amount: '1袋' },
      { name: 'ニラ', amount: '1/2束' },
      { name: 'ナンプラー', amount: '大さじ2' },
      { name: 'タマリンドペースト', amount: '大さじ1' },
      { name: 'ピーナッツ', amount: '大さじ2' },
      { name: 'ライム', amount: '1/2個' },
    ],
    steps: [
      'センレックをぬるま湯で戻す',
      'フライパンでエビを炒め、取り出す',
      '麺を加え、ナンプラー・タマリンド・砂糖で味付け',
      'もやし・ニラ・エビを戻して炒め合わせる',
      '砕いたピーナッツとライムを添えて盛り付ける',
    ],
    cookingTimeMinutes: 20,
    calories: 400,
    nutrition: { calories: 400, protein: 18, fat: 14, carbs: 50, fiber: 2.0, salt: 3.2 },
    difficulty: 'advanced',
    genres: ['ethnic'],
    moods: ['refreshing', 'hearty'],
  },
  {
    name: '和風おろしハンバーグ',
    description: '大根おろしとポン酢でさっぱりいただくハンバーグ',
    rarity: 'SR',
    ingredients: [
      { name: '合いびき肉', amount: '400g' },
      { name: '玉ねぎ', amount: '1個' },
      { name: 'パン粉', amount: '1/2カップ' },
      { name: '卵', amount: '1個' },
      { name: '大根', amount: '1/3本' },
      { name: 'ポン酢', amount: '適量' },
      { name: '大葉', amount: '5枚' },
    ],
    steps: [
      '玉ねぎをみじん切りにし、炒めて冷ます',
      'ひき肉・玉ねぎ・パン粉・卵を練り混ぜ、成形する',
      'フライパンで両面を焼き、蒸し焼きにして火を通す',
      '大根をすりおろし、軽く水気を切る',
      'ハンバーグに大根おろし・大葉をのせ、ポン酢をかける',
    ],
    cookingTimeMinutes: 35,
    calories: 400,
    nutrition: { calories: 400, protein: 24, fat: 22, carbs: 24, fiber: 2.0, salt: 2.0 },
    difficulty: 'advanced',
    genres: ['japanese', 'western'],
    moods: ['refreshing', 'hearty'],
  },
  {
    name: 'マルゲリータピザ',
    description: '手作り生地にトマトソースとモッツァレラの王道ピザ',
    rarity: 'SR',
    ingredients: [
      { name: '強力粉', amount: '200g' },
      { name: 'ドライイースト', amount: '3g' },
      { name: 'トマトソース', amount: '100ml' },
      { name: 'モッツァレラチーズ', amount: '150g' },
      { name: 'バジルの葉', amount: '10枚' },
      { name: 'オリーブオイル', amount: '大さじ2' },
    ],
    steps: [
      '強力粉・イースト・塩・水を混ぜて10分こね、30分発酵させる',
      '生地を丸く伸ばし、フォークで穴を開ける',
      'トマトソースを塗り、ちぎったモッツァレラを並べる',
      '250℃のオーブンで8〜10分焼く',
      'バジルとオリーブオイルをかけて仕上げる',
    ],
    cookingTimeMinutes: 50,
    calories: 480,
    nutrition: { calories: 480, protein: 18, fat: 20, carbs: 55, fiber: 2.0, salt: 2.0 },
    difficulty: 'advanced',
    genres: ['italian'] as Genre[],
    moods: ['hearty', 'rich'] as Mood[],
  },
  {
    name: 'カルボナーラ',
    description: '卵とチーズの濃厚クリーミーパスタ',
    rarity: 'R',
    ingredients: [
      { name: 'スパゲティ', amount: '200g' },
      { name: 'ベーコン', amount: '100g' },
      { name: '卵黄', amount: '3個' },
      { name: 'パルメザンチーズ', amount: '50g' },
      { name: '黒胡椒', amount: '適量' },
      { name: 'オリーブオイル', amount: '大さじ1' },
    ],
    steps: [
      'パスタをアルデンテに茹でる',
      'ベーコンをオリーブオイルでカリカリに炒める',
      '卵黄・チーズ・黒胡椒を混ぜてソースを作る',
      '茹で上がったパスタとベーコンを合わせる',
      '火を止めて卵ソースを絡め、余熱で仕上げる',
    ],
    cookingTimeMinutes: 20,
    calories: 550,
    nutrition: { calories: 550, protein: 22, fat: 24, carbs: 58, fiber: 2.0, salt: 2.5 },
    difficulty: 'normal',
    genres: ['italian'] as Genre[],
    moods: ['rich', 'hearty'] as Mood[],
  },
  {
    name: 'トムヤムチャーハン',
    description: '酸味と辛みが効いたタイ風チャーハン',
    rarity: 'R',
    ingredients: [
      { name: 'ごはん', amount: '2膳分' },
      { name: 'むきエビ', amount: '150g' },
      { name: 'トムヤムペースト', amount: '大さじ1.5' },
      { name: '卵', amount: '2個' },
      { name: 'ナンプラー', amount: '大さじ1' },
      { name: 'ライム', amount: '1/2個' },
      { name: 'パクチー', amount: '適量' },
    ],
    steps: [
      'フライパンでエビを炒めて取り出す',
      '溶き卵を入れて半熟で炒め、ごはんを加える',
      'トムヤムペーストとナンプラーで味付け',
      'エビを戻して炒め合わせる',
      'ライムを絞り、パクチーを添える',
    ],
    cookingTimeMinutes: 15,
    calories: 420,
    nutrition: { calories: 420, protein: 20, fat: 14, carbs: 52, fiber: 1.0, salt: 3.0 },
    difficulty: 'beginner',
    genres: ['thai'] as Genre[],
    moods: ['spicy', 'refreshing'] as Mood[],
  },
  {
    name: 'カオマンガイ',
    description: 'しっとり茹で鶏とジンジャーライスのタイ風チキンライス',
    rarity: 'SR',
    ingredients: [
      { name: '鶏もも肉', amount: '2枚' },
      { name: '米', amount: '2合' },
      { name: '生姜', amount: '2片' },
      { name: 'にんにく', amount: '2片' },
      { name: 'ナンプラー', amount: '大さじ2' },
      { name: '味噌', amount: '大さじ1' },
      { name: 'ねぎ', amount: '1本' },
      { name: 'パクチー', amount: '適量' },
    ],
    steps: [
      '鶏肉に塩を揉み込み、生姜・ねぎと一緒に30分茹でる',
      '茹で汁でごはんを炊く（にんにくスライスも一緒に）',
      '鶏肉を氷水にとり、食べやすく切る',
      'ナンプラー・味噌・砂糖・レモン汁・生姜でタレを作る',
      'ジンジャーライスの上に鶏肉を盛り、タレとパクチーを添える',
    ],
    cookingTimeMinutes: 50,
    calories: 520,
    nutrition: { calories: 520, protein: 30, fat: 16, carbs: 60, fiber: 1.0, salt: 2.8 },
    difficulty: 'advanced',
    genres: ['thai'] as Genre[],
    moods: ['hearty', 'refreshing'] as Mood[],
  },
  {
    name: 'バターチキンカレー',
    description: 'トマトとバターのまろやかなインド風カレー',
    rarity: 'SR',
    ingredients: [
      { name: '鶏もも肉', amount: '400g' },
      { name: 'ヨーグルト', amount: '100g' },
      { name: 'カレー粉', amount: '大さじ2' },
      { name: 'トマト缶', amount: '1缶' },
      { name: 'バター', amount: '30g' },
      { name: '生クリーム', amount: '100ml' },
      { name: 'にんにく', amount: '2片' },
      { name: '生姜', amount: '1片' },
    ],
    steps: [
      '鶏肉をヨーグルト・カレー粉に30分漬ける',
      'バターでにんにく・生姜を炒め、鶏肉を加えて焼く',
      'トマト缶を加えて20分煮込む',
      '生クリームを加えてまろやかに仕上げる',
      'ナンまたはごはんと一緒に盛り付ける',
    ],
    cookingTimeMinutes: 45,
    calories: 550,
    nutrition: { calories: 550, protein: 28, fat: 30, carbs: 35, fiber: 2.0, salt: 2.0 },
    difficulty: 'normal',
    genres: ['indian'] as Genre[],
    moods: ['rich', 'spicy'] as Mood[],
  },
  {
    name: 'キーマカレー',
    description: 'スパイス香るひき肉のドライカレー',
    rarity: 'R',
    ingredients: [
      { name: '合いびき肉', amount: '300g' },
      { name: '玉ねぎ', amount: '1個' },
      { name: 'にんじん', amount: '1/2本' },
      { name: 'カレー粉', amount: '大さじ2' },
      { name: 'トマト缶', amount: '1/2缶' },
      { name: 'にんにく', amount: '1片' },
      { name: '卵', amount: '人数分' },
    ],
    steps: [
      'にんにく・玉ねぎ・にんじんをみじん切りにする',
      'ひき肉を炒めてカレー粉を加える',
      '野菜を加えてさらに炒める',
      'トマト缶・水を少量加えて15分煮詰める',
      'ごはんに盛り、目玉焼きをのせる',
    ],
    cookingTimeMinutes: 25,
    calories: 480,
    nutrition: { calories: 480, protein: 22, fat: 22, carbs: 45, fiber: 2.5, salt: 2.0 },
    difficulty: 'beginner',
    genres: ['indian'] as Genre[],
    moods: ['spicy', 'hearty'] as Mood[],
  },
  {
    name: 'タコライス',
    description: 'スパイシーなタコミートとサルサのメキシカンどんぶり',
    rarity: 'R',
    ingredients: [
      { name: '合いびき肉', amount: '300g' },
      { name: 'レタス', amount: '4枚' },
      { name: 'トマト', amount: '1個' },
      { name: 'チーズ', amount: '80g' },
      { name: 'チリパウダー', amount: '大さじ1' },
      { name: 'ケチャップ', amount: '大さじ2' },
      { name: 'ウスターソース', amount: '大さじ1' },
    ],
    steps: [
      'ひき肉を炒め、チリパウダー・ケチャップ・ウスターソースで味付け',
      'トマトを角切り、レタスを千切りにする',
      'ごはんの上にレタス・タコミート・トマト・チーズを盛る',
      'お好みでサルサソースをかける',
    ],
    cookingTimeMinutes: 15,
    calories: 520,
    nutrition: { calories: 520, protein: 24, fat: 22, carbs: 52, fiber: 2.0, salt: 2.5 },
    difficulty: 'beginner',
    genres: ['mexican'] as Genre[],
    moods: ['spicy', 'hearty'] as Mood[],
  },
  {
    name: 'チリコンカン',
    description: '豆とひき肉のスパイシー煮込み',
    rarity: 'R',
    ingredients: [
      { name: '合いびき肉', amount: '250g' },
      { name: 'ミックスビーンズ', amount: '1缶' },
      { name: 'トマト缶', amount: '1缶' },
      { name: '玉ねぎ', amount: '1個' },
      { name: 'にんにく', amount: '2片' },
      { name: 'チリパウダー', amount: '大さじ1' },
      { name: 'クミン', amount: '小さじ1' },
    ],
    steps: [
      'にんにく・玉ねぎをみじん切りにして炒める',
      'ひき肉を加えて炒め、スパイスを加える',
      'トマト缶・ビーンズを加えて煮込む',
      '20分煮込んで味を調える',
      'トルティーヤやごはんと一緒に盛る',
    ],
    cookingTimeMinutes: 30,
    calories: 400,
    nutrition: { calories: 400, protein: 22, fat: 16, carbs: 38, fiber: 8.0, salt: 2.0 },
    difficulty: 'normal',
    genres: ['mexican'] as Genre[],
    moods: ['spicy', 'hearty', 'healthy'] as Mood[],
  },
  {
    name: '鶏むね肉のみぞれ煮',
    description: '大根おろしでさっぱり煮込んだやさしい鶏料理',
    rarity: 'R',
    ingredients: [
      { name: '鶏むね肉', amount: '1枚' },
      { name: '大根', amount: '1/3本' },
      { name: '醤油', amount: '大さじ1' },
      { name: 'みりん', amount: '大さじ1' },
      { name: 'だし汁', amount: '200ml' },
      { name: '片栗粉', amount: '大さじ1' },
    ],
    steps: [
      '鶏むね肉をそぎ切りにし、片栗粉をまぶす',
      '大根をすりおろす',
      '鍋にだし汁・醤油・みりんを煮立て、鶏肉を入れる',
      '火が通ったら大根おろしを加えてひと煮立ち',
      '器に盛り付ける',
    ],
    cookingTimeMinutes: 20,
    calories: 200,
    nutrition: { calories: 200, protein: 25, fat: 4, carbs: 14, fiber: 1.5, salt: 1.8 },
    difficulty: 'beginner',
    gentle: true,
    genres: ['japanese'] as Genre[],
    moods: ['refreshing', 'healthy'] as Mood[],
  },
  {
    name: '卵がゆ',
    description: 'ふんわり卵のやさしいおかゆ',
    rarity: 'N',
    ingredients: [
      { name: 'ごはん', amount: '1膳分' },
      { name: '卵', amount: '1個' },
      { name: 'だし汁', amount: '400ml' },
      { name: '塩', amount: '少々' },
      { name: 'ねぎ（小口切り）', amount: '適量' },
    ],
    steps: [
      'だし汁にごはんを入れて弱火で10分煮る',
      '塩で味を調える',
      '溶き卵を回し入れ、ふんわり固まるまで待つ',
      '器に盛り、ねぎを散らす',
    ],
    cookingTimeMinutes: 15,
    calories: 180,
    nutrition: { calories: 180, protein: 8, fat: 4, carbs: 28, fiber: 0.3, salt: 1.0 },
    difficulty: 'beginner',
    gentle: true,
    genres: ['japanese'] as Genre[],
    moods: ['refreshing', 'healthy'] as Mood[],
  },
  {
    name: '煮込みうどん',
    description: '具材たっぷりの温かい煮込みうどん',
    rarity: 'N',
    ingredients: [
      { name: 'うどん', amount: '2玉' },
      { name: '鶏もも肉', amount: '100g' },
      { name: 'ねぎ', amount: '1本' },
      { name: 'にんじん', amount: '1/2本' },
      { name: 'だし汁', amount: '800ml' },
      { name: '醤油', amount: '大さじ2' },
      { name: 'みりん', amount: '大さじ1' },
    ],
    steps: [
      '鶏肉を小さめに切り、ねぎは斜め切り、にんじんは薄切り',
      '鍋にだし汁を沸かし、鶏肉とにんじんを入れて煮る',
      'うどんを加えて5分煮込む',
      '醤油・みりんで味付けし、ねぎを加える',
    ],
    cookingTimeMinutes: 15,
    calories: 350,
    nutrition: { calories: 350, protein: 18, fat: 6, carbs: 55, fiber: 2.0, salt: 2.5 },
    difficulty: 'beginner',
    gentle: true,
    genres: ['japanese'] as Genre[],
    moods: ['healthy', 'refreshing'] as Mood[],
  },
  {
    name: '豆腐の和風あんかけ',
    description: 'とろーりあんが体を温めるやさしい豆腐料理',
    rarity: 'R',
    ingredients: [
      { name: '絹豆腐', amount: '1丁' },
      { name: 'だし汁', amount: '300ml' },
      { name: '醤油', amount: '大さじ1' },
      { name: 'みりん', amount: '大さじ1' },
      { name: '片栗粉', amount: '大さじ1' },
      { name: '生姜（すりおろし）', amount: '小さじ1' },
      { name: 'ねぎ（小口切り）', amount: '適量' },
    ],
    steps: [
      '豆腐を食べやすい大きさに切り、鍋で温める',
      'だし汁・醤油・みりんを煮立てる',
      '水溶き片栗粉でとろみをつける',
      '温めた豆腐にあんをかけ、生姜とねぎを添える',
    ],
    cookingTimeMinutes: 10,
    calories: 120,
    nutrition: { calories: 120, protein: 8, fat: 5, carbs: 10, fiber: 0.5, salt: 1.5 },
    difficulty: 'beginner',
    gentle: true,
    genres: ['japanese'] as Genre[],
    moods: ['refreshing', 'healthy'] as Mood[],
  },
];

const SIDE_RECIPES: Recipe[] = [
  {
    name: 'ほうれん草のおひたし',
    description: 'だし醤油でシンプルに味わう定番副菜',
    rarity: 'N',
    ingredients: [
      { name: 'ほうれん草', amount: '1束' },
      { name: 'かつお節', amount: '適量' },
      { name: '醤油', amount: '小さじ2' },
      { name: 'だし汁', amount: '大さじ2' },
    ],
    steps: [
      'ほうれん草をたっぷりの湯で1分茹でる',
      '冷水にとって色止めし、水気を絞る',
      '4cm長さに切り、だし汁と醤油で和える',
      '器に盛り、かつお節をのせる',
    ],
    cookingTimeMinutes: 10,
    calories: 30,
    nutrition: { calories: 30, protein: 3, fat: 0.5, carbs: 3, fiber: 2.5, salt: 0.8 },
  },
  {
    name: 'きんぴらごぼう',
    description: '甘辛く炒めたシャキシャキごぼうとにんじん',
    rarity: 'R',
    ingredients: [
      { name: 'ごぼう', amount: '1本' },
      { name: 'にんじん', amount: '1/2本' },
      { name: '醤油', amount: '大さじ1.5' },
      { name: 'みりん', amount: '大さじ1' },
      { name: 'ごま油', amount: '大さじ1' },
      { name: '白ごま', amount: '適量' },
    ],
    steps: [
      'ごぼうとにんじんを千切りにする',
      'ごぼうは水にさらしてアクを抜く',
      'フライパンにごま油を熱し、ごぼうとにんじんを炒める',
      '醤油・みりんを加えて汁気がなくなるまで炒める',
      '白ごまを振って仕上げる',
    ],
    cookingTimeMinutes: 15,
    calories: 80,
    nutrition: { calories: 80, protein: 2, fat: 3, carbs: 12, fiber: 3.5, salt: 1.2 },
  },
  {
    name: 'ポテトサラダ',
    description: 'ほくほくじゃがいもの昔ながらのポテサラ',
    rarity: 'R',
    ingredients: [
      { name: 'じゃがいも', amount: '3個' },
      { name: 'きゅうり', amount: '1本' },
      { name: 'ハム', amount: '3枚' },
      { name: 'マヨネーズ', amount: '大さじ3' },
      { name: '酢', amount: '小さじ1' },
      { name: '塩胡椒', amount: '適量' },
    ],
    steps: [
      'じゃがいもを茹でて熱いうちにつぶす',
      'きゅうりを薄切りにして塩もみし、水気を絞る',
      'ハムを短冊切りにする',
      'じゃがいもに酢を混ぜ、粗熱が取れたらマヨネーズで和える',
      'きゅうりとハムを加え、塩胡椒で味を調える',
    ],
    cookingTimeMinutes: 20,
    calories: 180,
    nutrition: { calories: 180, protein: 4, fat: 10, carbs: 20, fiber: 1.5, salt: 1.0 },
  },
  {
    name: '冷奴',
    description: 'ねぎと生姜をのせた夏のさっぱり冷奴',
    rarity: 'N',
    ingredients: [
      { name: '絹豆腐', amount: '1丁' },
      { name: 'ねぎ（小口切り）', amount: '適量' },
      { name: '生姜（すりおろし）', amount: '適量' },
      { name: 'かつお節', amount: '適量' },
      { name: '醤油', amount: '適量' },
    ],
    steps: [
      '豆腐を食べやすい大きさに切る',
      '器に盛り、ねぎ・生姜・かつお節をのせる',
      '醤油をかけていただく',
    ],
    cookingTimeMinutes: 3,
    calories: 80,
    nutrition: { calories: 80, protein: 7, fat: 4, carbs: 3, fiber: 0.5, salt: 0.8 },
  },
  {
    name: 'コールスロー',
    description: 'さっぱり酸味のキャベツサラダ',
    rarity: 'R',
    ingredients: [
      { name: 'キャベツ', amount: '1/4個' },
      { name: 'にんじん', amount: '1/3本' },
      { name: 'コーン', amount: '大さじ3' },
      { name: 'マヨネーズ', amount: '大さじ2' },
      { name: '酢', amount: '大さじ1' },
      { name: '砂糖', amount: '小さじ1' },
    ],
    steps: [
      'キャベツを千切りにし、塩をふって5分置く',
      'にんじんを千切りにする',
      'キャベツの水気を絞る',
      'マヨネーズ・酢・砂糖を混ぜたドレッシングで和える',
      'コーンを加えて混ぜる',
    ],
    cookingTimeMinutes: 10,
    calories: 100,
    nutrition: { calories: 100, protein: 2, fat: 6, carbs: 10, fiber: 2.0, salt: 0.8 },
  },
  {
    name: 'たたききゅうり',
    description: 'ごま油と塩昆布のやみつききゅうり',
    rarity: 'N',
    ingredients: [
      { name: 'きゅうり', amount: '2本' },
      { name: 'ごま油', amount: '大さじ1' },
      { name: '塩昆布', amount: '大さじ1' },
      { name: '白ごま', amount: '適量' },
      { name: 'にんにく（チューブ）', amount: '少々' },
    ],
    steps: [
      'きゅうりを麺棒で叩き、手で一口大にちぎる',
      'ポリ袋にきゅうり・ごま油・塩昆布・にんにくを入れる',
      'よく揉んで5分置く',
      '器に盛り、白ごまを振る',
    ],
    cookingTimeMinutes: 5,
    calories: 40,
    nutrition: { calories: 40, protein: 1, fat: 2, carbs: 4, fiber: 1.0, salt: 1.0 },
  },
  {
    name: 'かぼちゃの煮物',
    description: 'ほっくり甘いかぼちゃの和風煮',
    rarity: 'R',
    ingredients: [
      { name: 'かぼちゃ', amount: '1/4個' },
      { name: 'だし汁', amount: '200ml' },
      { name: '醤油', amount: '大さじ1' },
      { name: 'みりん', amount: '大さじ1' },
      { name: '砂糖', amount: '大さじ1' },
    ],
    steps: [
      'かぼちゃを一口大に切り、皮を所々むく',
      '鍋にだし汁・醤油・みりん・砂糖を入れて煮立てる',
      'かぼちゃを皮を下にして並べる',
      '落とし蓋をして15分煮る',
      '火を止めてそのまま冷まし、味を含ませる',
    ],
    cookingTimeMinutes: 25,
    calories: 120,
    nutrition: { calories: 120, protein: 2, fat: 0.5, carbs: 28, fiber: 3.0, salt: 1.2 },
  },
  {
    name: 'ナムル3種盛り',
    description: 'ごま油香る韓国風野菜のナムル',
    rarity: 'SR',
    ingredients: [
      { name: 'もやし', amount: '1袋' },
      { name: 'ほうれん草', amount: '1/2束' },
      { name: 'にんじん', amount: '1本' },
      { name: 'ごま油', amount: '大さじ2' },
      { name: '塩', amount: '適量' },
      { name: '白ごま', amount: '適量' },
      { name: 'にんにく（すりおろし）', amount: '少々' },
    ],
    steps: [
      'もやしを1分茹でてザルにあげる',
      'ほうれん草を茹でて4cm幅に切る',
      'にんじんを千切りにしてさっと茹でる',
      'それぞれにごま油・塩・にんにく・ごまで味付けする',
      '3種を器に盛り合わせる',
    ],
    cookingTimeMinutes: 15,
    calories: 90,
    nutrition: { calories: 90, protein: 4, fat: 4, carbs: 8, fiber: 3.0, salt: 1.5 },
  },
];

const SOUP_RECIPES: Recipe[] = [
  {
    name: '味噌汁（豆腐とわかめ）',
    description: '毎日飲みたいシンプルな味噌汁',
    rarity: 'N',
    ingredients: [
      { name: '豆腐', amount: '1/2丁' },
      { name: '乾燥わかめ', amount: '大さじ1' },
      { name: '味噌', amount: '大さじ2' },
      { name: 'だし汁', amount: '600ml' },
      { name: 'ねぎ（小口切り）', amount: '適量' },
    ],
    steps: [
      'だし汁を鍋で温める',
      '豆腐を1cm角に切って加える',
      'わかめを加えてひと煮立ちさせる',
      '火を止めて味噌を溶き入れる',
      '器に盛り、ねぎを散らす',
    ],
    cookingTimeMinutes: 10,
    calories: 50,
    nutrition: { calories: 50, protein: 4, fat: 2, carbs: 4, fiber: 1.0, salt: 1.8 },
  },
  {
    name: '豚汁',
    description: '具だくさんで栄養満点の豚汁',
    rarity: 'R',
    ingredients: [
      { name: '豚バラ薄切り', amount: '100g' },
      { name: '大根', amount: '1/4本' },
      { name: 'にんじん', amount: '1/2本' },
      { name: 'ごぼう', amount: '1/2本' },
      { name: '味噌', amount: '大さじ3' },
      { name: 'だし汁', amount: '800ml' },
      { name: 'ごま油', amount: '少々' },
    ],
    steps: [
      '野菜を食べやすい大きさに切る',
      '鍋でごま油を熱し、豚肉を炒める',
      '野菜を加えて軽く炒め、だし汁を加える',
      'アクを取りながら野菜が柔らかくなるまで煮る',
      '火を止めて味噌を溶き入れる',
    ],
    cookingTimeMinutes: 25,
    calories: 150,
    nutrition: { calories: 150, protein: 10, fat: 6, carbs: 14, fiber: 2.5, salt: 2.0 },
  },
  {
    name: 'コーンスープ',
    description: 'クリーミーで甘い洋風コーンスープ',
    rarity: 'R',
    ingredients: [
      { name: 'コーンクリーム缶', amount: '1缶' },
      { name: '牛乳', amount: '200ml' },
      { name: 'バター', amount: '10g' },
      { name: 'コンソメ', amount: '1個' },
      { name: '塩胡椒', amount: '適量' },
      { name: 'パセリ', amount: '適量' },
    ],
    steps: [
      '鍋にバターを溶かし、コーンクリームを入れる',
      '牛乳を少しずつ加えながら混ぜる',
      'コンソメを加えて温める',
      '塩胡椒で味を調える',
      '器に盛り、パセリを散らす',
    ],
    cookingTimeMinutes: 10,
    calories: 120,
    nutrition: { calories: 120, protein: 3, fat: 5, carbs: 16, fiber: 0.5, salt: 1.2 },
  },
  {
    name: 'わかめスープ',
    description: 'ごま油香る韓国風わかめスープ',
    rarity: 'N',
    ingredients: [
      { name: '乾燥わかめ', amount: '大さじ2' },
      { name: 'ごま油', amount: '大さじ1' },
      { name: '鶏がらスープの素', amount: '小さじ2' },
      { name: '水', amount: '600ml' },
      { name: '白ごま', amount: '適量' },
      { name: '醤油', amount: '小さじ1' },
    ],
    steps: [
      '鍋にごま油を熱し、戻したわかめを炒める',
      '水を加えて煮立てる',
      '鶏がらスープの素と醤油で味付けする',
      '器に盛り、白ごまを振る',
    ],
    cookingTimeMinutes: 8,
    calories: 30,
    nutrition: { calories: 30, protein: 1, fat: 2, carbs: 2, fiber: 1.5, salt: 1.5 },
  },
  {
    name: 'かきたま汁',
    description: 'ふわふわ卵の優しい味わいの和風スープ',
    rarity: 'R',
    ingredients: [
      { name: '卵', amount: '2個' },
      { name: 'だし汁', amount: '600ml' },
      { name: '醤油', amount: '小さじ2' },
      { name: '塩', amount: '少々' },
      { name: '片栗粉', amount: '小さじ1' },
      { name: '三つ葉', amount: '適量' },
    ],
    steps: [
      'だし汁を鍋で温め、醤油と塩で味付けする',
      '水溶き片栗粉を加えてとろみをつける',
      '溶き卵を細く回し入れる',
      'ふわっと浮いてきたら火を止める',
      '器に盛り、三つ葉を添える',
    ],
    cookingTimeMinutes: 10,
    calories: 60,
    nutrition: { calories: 60, protein: 5, fat: 3, carbs: 3, fiber: 0.2, salt: 1.5 },
  },
  {
    name: 'トムヤムクン風スープ',
    description: '酸味と辛みが効いたエスニックスープ',
    rarity: 'SR',
    ingredients: [
      { name: 'むきエビ', amount: '100g' },
      { name: 'しめじ', amount: '1/2パック' },
      { name: 'トマト', amount: '1個' },
      { name: 'ナンプラー', amount: '大さじ1' },
      { name: 'レモン汁', amount: '大さじ2' },
      { name: '鶏がらスープの素', amount: '小さじ2' },
      { name: '豆板醤', amount: '小さじ1' },
      { name: 'パクチー', amount: '適量' },
    ],
    steps: [
      '鍋に水と鶏がらスープの素を入れて煮立てる',
      'しめじ・トマト・エビを加えて煮る',
      'ナンプラー・レモン汁・豆板醤で味付けする',
      '器に盛り、パクチーをのせる',
    ],
    cookingTimeMinutes: 15,
    calories: 70,
    nutrition: { calories: 70, protein: 8, fat: 2, carbs: 6, fiber: 1.0, salt: 2.0 },
  },
  {
    name: 'ミネストローネ',
    description: '野菜たっぷりのイタリアンスープ',
    rarity: 'SR',
    ingredients: [
      { name: 'ベーコン', amount: '2枚' },
      { name: 'じゃがいも', amount: '1個' },
      { name: 'にんじん', amount: '1/2本' },
      { name: 'セロリ', amount: '1/2本' },
      { name: 'トマト缶', amount: '1/2缶' },
      { name: 'コンソメ', amount: '1個' },
      { name: 'オリーブオイル', amount: '大さじ1' },
    ],
    steps: [
      '野菜とベーコンを1cm角に切る',
      'オリーブオイルでベーコンを炒め、野菜を加える',
      'トマト缶・水・コンソメを加えて煮込む',
      '野菜が柔らかくなるまで15分煮る',
      '塩胡椒で味を調える',
    ],
    cookingTimeMinutes: 25,
    calories: 130,
    nutrition: { calories: 130, protein: 5, fat: 4, carbs: 18, fiber: 3.0, salt: 1.5 },
  },
  {
    name: '中華たまごスープ',
    description: 'とろ〜り中華風のやさしいスープ',
    rarity: 'N',
    ingredients: [
      { name: '卵', amount: '2個' },
      { name: '鶏がらスープの素', amount: '小さじ2' },
      { name: '水', amount: '600ml' },
      { name: '片栗粉', amount: '大さじ1' },
      { name: 'ごま油', amount: '少々' },
      { name: 'ねぎ', amount: '適量' },
    ],
    steps: [
      '鍋に水と鶏がらスープの素を入れて煮立てる',
      '水溶き片栗粉でとろみをつける',
      '溶き卵を回し入れ、ふわっと仕上げる',
      'ごま油を回しかける',
      'ねぎを散らして盛り付ける',
    ],
    cookingTimeMinutes: 8,
    calories: 50,
    nutrition: { calories: 50, protein: 4, fat: 2, carbs: 4, fiber: 0.2, salt: 1.5 },
  },
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickByRarity<T extends { rarity: Rarity }>(arr: T[], targetRarity: Rarity): T {
  const matched = arr.filter((r) => r.rarity === targetRarity);
  if (matched.length > 0) return pickRandom(matched);
  // Fallback: try lower rarity, then any
  const fallbackOrder: Rarity[] = ['SR', 'R', 'N'];
  for (const r of fallbackOrder) {
    const fallback = arr.filter((x) => x.rarity === r);
    if (fallback.length > 0) return pickRandom(fallback);
  }
  return pickRandom(arr);
}

function filterMainByGenre(genre: Genre): MainRecipe[] {
  if (genre === 'random') return MAIN_RECIPES;
  const matched = MAIN_RECIPES.filter((r) => r.genres.includes(genre));
  return matched.length > 0 ? matched : MAIN_RECIPES;
}

function filterMainByMoods(recipes: MainRecipe[], moods: Mood[]): MainRecipe[] {
  if (moods.length === 0) return recipes;
  const matched = recipes.filter((r) => moods.some((m) => r.moods.includes(m)));
  return matched.length > 0 ? matched : recipes;
}

function stripMeta(recipe: MainRecipe): Recipe {
  const { genres: _g, moods: _m, difficulty: _d, gentle: _gentle, ...rest } = recipe;
  return { ...rest, difficulty: _d };
}

function filterByDisliked<T extends { ingredients: { name: string }[] }>(
  recipes: T[],
  disliked: string[],
): T[] {
  if (disliked.length === 0) return recipes;
  const filtered = recipes.filter(
    (r) => !r.ingredients.some((ing) => disliked.includes(ing.name)),
  );
  return filtered.length > 0 ? filtered : recipes;
}

function filterByDifficulty<T extends { difficulty?: Difficulty }>(
  recipes: T[],
  beginnerMode: boolean,
): T[] {
  if (!beginnerMode) return recipes;
  const filtered = recipes.filter((r) => r.difficulty === 'beginner');
  return filtered.length > 0 ? filtered : recipes;
}

function filterByCalorie<T extends { calories?: number }>(
  recipes: T[],
  maxCalories: number,
): T[] {
  const filtered = recipes.filter((r) => (r.calories ?? 0) <= maxCalories);
  return filtered.length > 0 ? filtered : recipes;
}

function filterByGentleOptions<T extends { nutrition?: { calories: number; protein: number; fat: number; carbs: number; salt: number }; ingredients: { name: string }[] }>(
  recipes: T[],
  options: GentleOption[],
  gentleField?: boolean,
): T[] {
  if (options.length === 0 && !gentleField) return recipes;

  let pool = recipes;

  // easyDigest: prefer gentle-tagged recipes (for MainRecipe with gentle field)
  if (options.includes('easyDigest') && gentleField) {
    const gentleOnly = pool.filter((r) => (r as Record<string, unknown>).gentle === true);
    if (gentleOnly.length > 0) pool = gentleOnly;
  }

  // Nutrition-based filters
  if (options.includes('lowSalt')) {
    const f = pool.filter((r) => (r.nutrition?.salt ?? 99) <= 1.5);
    if (f.length > 0) pool = f;
  }
  if (options.includes('lowCarb')) {
    const f = pool.filter((r) => (r.nutrition?.carbs ?? 99) <= 40);
    if (f.length > 0) pool = f;
  }
  if (options.includes('lowFat')) {
    const f = pool.filter((r) => (r.nutrition?.fat ?? 99) <= 10);
    if (f.length > 0) pool = f;
  }
  if (options.includes('lowProtein')) {
    const f = pool.filter((r) => (r.nutrition?.protein ?? 99) <= 15);
    if (f.length > 0) pool = f;
  }
  if (options.includes('lowPurine')) {
    const f = pool.filter(
      (r) => !r.ingredients.some((ing) => HIGH_PURINE_INGREDIENTS.includes(ing.name)),
    );
    if (f.length > 0) pool = f;
  }

  return pool;
}

export async function generateMealPlan(
  selection: MealSelection,
  dislikedIngredients: string[] = [],
): Promise<MealPlan> {
  // Simulate API latency
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Roll rarity for main dish (gacha!)
  const mainRarity = rollRarity();

  let mainPool = filterMainByGenre(selection.genre);
  mainPool = filterMainByMoods(mainPool, selection.moods);
  mainPool = filterByDisliked(mainPool, dislikedIngredients);
  mainPool = filterByDifficulty(mainPool, selection.beginnerMode);

  // Diet mode: budget calories across main(60%), side(20%), soup(20%)
  if (selection.dietMode) {
    mainPool = filterByCalorie(mainPool, DIET_CALORIE_TARGET * 0.6);
  }

  // Gentle mode filtering
  if (selection.gentleMode || selection.gentleOptions.length > 0) {
    mainPool = filterByGentleOptions(mainPool, selection.gentleOptions, true);
  }

  const mainRecipe = pickByRarity(mainPool, mainRarity);
  const main = stripMeta(mainRecipe);

  let sidePool = filterByDisliked(SIDE_RECIPES, dislikedIngredients);
  let soupPool = filterByDisliked(SOUP_RECIPES, dislikedIngredients);

  if (selection.dietMode) {
    sidePool = filterByCalorie(sidePool, DIET_CALORIE_TARGET * 0.25);
    soupPool = filterByCalorie(soupPool, DIET_CALORIE_TARGET * 0.2);
  }

  if (selection.gentleMode || selection.gentleOptions.length > 0) {
    sidePool = filterByGentleOptions(sidePool, selection.gentleOptions);
    soupPool = filterByGentleOptions(soupPool, selection.gentleOptions);
  }

  const side = pickRandom(sidePool);
  const soup = pickRandom(soupPool);

  // Adjust amounts text based on servings (simple label append)
  const adjustServings = (recipe: Recipe): Recipe => ({
    ...recipe,
    ingredients: recipe.ingredients.map((ing) => ({
      ...ing,
      amount: selection.servings === 1
        ? ing.amount
        : `${ing.amount}（${selection.servings}人分に調整）`,
    })),
  });

  return {
    main: adjustServings(main),
    side: adjustServings(side),
    soup: adjustServings(soup),
    generatedAt: new Date().toISOString(),
  };
}
