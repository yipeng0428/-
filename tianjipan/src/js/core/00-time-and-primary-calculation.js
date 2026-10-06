const DONATE_IMG = __TJ_ASSET_DONATE_IMG__;
/* ================= CORE · 纯算法层(无 DOM) ================= */
const GAN = "甲乙丙丁戊己庚辛壬癸".split("");
const ZHI = "子丑寅卯辰巳午未申酉戌亥".split("");
const WX = ["木", "火", "土", "金", "水"];
const GAN_WX = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4];
const ZHI_WX = [4, 2, 0, 0, 2, 1, 1, 2, 3, 3, 2, 4];
const CANG = [
  [9],
  [5, 9, 7],
  [0, 2, 4],
  [1],
  [4, 1, 9],
  [2, 6, 4],
  [3, 5],
  [5, 3, 1],
  [6, 8, 4],
  [7],
  [4, 7, 3],
  [8, 0],
];
const NAYIN = [
  "海中金",
  "炉中火",
  "大林木",
  "路旁土",
  "剑锋金",
  "山头火",
  "涧下水",
  "城头土",
  "白蜡金",
  "杨柳木",
  "泉中水",
  "屋上土",
  "霹雳火",
  "松柏木",
  "长流水",
  "沙中金",
  "山下火",
  "平地木",
  "壁上土",
  "金箔金",
  "覆灯火",
  "天河水",
  "大驿土",
  "钗钏金",
  "桑柘木",
  "大溪水",
  "沙中土",
  "天上火",
  "石榴木",
  "大海水",
];
const TERMS = [
  "春分",
  "清明",
  "谷雨",
  "立夏",
  "小满",
  "芒种",
  "夏至",
  "小暑",
  "大暑",
  "立秋",
  "处暑",
  "白露",
  "秋分",
  "寒露",
  "霜降",
  "立冬",
  "小雪",
  "大雪",
  "冬至",
  "小寒",
  "大寒",
  "立春",
  "雨水",
  "惊蛰",
];
const JIE = [
  "立春",
  "惊蛰",
  "清明",
  "立夏",
  "芒种",
  "小暑",
  "立秋",
  "白露",
  "寒露",
  "立冬",
  "大雪",
  "小寒",
];
const gz = (i) => GAN[((i % 10) + 10) % 10] + ZHI[((i % 12) + 12) % 12];
function ganzhiIdx(s, b) {
  for (let n = 0; n < 60; n++) if (n % 10 === s && n % 12 === b) return n;
  return 0;
}

/* ---- 儒略日 / 天文 ---- */
function jdFromGreg(y, m, d, h = 0, mi = 0, s = 0) {
  if (m <= 2) {
    y -= 1;
    m += 12;
  }
  const A = Math.floor(y / 100),
    B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    d +
    B -
    1524.5 +
    (h + mi / 60 + s / 3600) / 24
  );
}
function fromJD(jd) {
  const J = jd + 0.5,
    Z = Math.floor(J),
    F = J - Z;
  let A = Z;
  if (Z >= 2299161) {
    const al = Math.floor((Z - 1867216.25) / 36524.25);
    A = Z + 1 + al - Math.floor(al / 4);
  }
  const B = A + 1524,
    C = Math.floor((B - 122.1) / 365.25),
    D = Math.floor(365.25 * C),
    E = Math.floor((B - D) / 30.6001);
  const d = B - D - Math.floor(30.6001 * E),
    m = E < 14 ? E - 1 : E - 13,
    y = m > 2 ? C - 4716 : C - 4715;
  const mins = Math.min(1439, Math.floor(F * 1440 + 1e-4));
  return { y, m, d, h: Math.floor(mins / 60), mi: mins % 60, s: Math.floor((F * 86400) % 60) };
}
function sunLonBase(jd) {
  // 太阳视黄经(度),Meeus 低精度公式(未校准)
  const T = (jd - 2451545) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = ((357.52911 + 35999.05029 * T - 0.0001537 * T * T) * Math.PI) / 180;
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
    (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
    0.000289 * Math.sin(3 * M);
  const om = ((125.04 - 1934.136 * T) * Math.PI) / 180;
  const lon = L0 + C - 0.00569 - 0.00478 * Math.sin(om) - 0.0041; // 末项:对照已公布节气表的经验校正(≈+6分钟)
  return ((lon % 360) + 360) % 360;
}
function eot(jd) {
  // 时差(分钟)
  const T = (jd - 2451545) / 36525;
  const L0 = ((280.46646 + 36000.76983 * T) * Math.PI) / 180;
  const e = 0.016708634 - 0.000042037 * T;
  const M = ((357.52911 + 35999.05029 * T) * Math.PI) / 180;
  const eps = ((23.439291 - 0.0130042 * T) * Math.PI) / 180;
  let y = Math.tan(eps / 2);
  y *= y;
  const E =
    y * Math.sin(2 * L0) -
    2 * e * Math.sin(M) +
    4 * e * y * Math.sin(M) * Math.cos(2 * L0) -
    0.5 * y * y * Math.sin(4 * L0) -
    1.25 * e * e * Math.sin(2 * M);
  return (4 * E * 180) / Math.PI;
}
function termJDb(target, guess) {
  let jd = guess;
  for (let i = 0; i < 10; i++) {
    const diff = ((sunLonBase(jd) - target + 540) % 360) - 180;
    jd -= diff / 0.98565;
  }
  return jd;
}
/* 节气时间校准:以 1900–2100 年 24×201 个节气精确时刻(天文历库对拍,与 astropy/VSOP 偏差 σ≈0.6 分钟)
   为节点,对低精度太阳模型做分段线性“时间扭曲”,使节气边界(月柱/奇门定局/大运)精确到约 1 分钟内。 */
const TERM_WARP =
  "am9oay9ub09pay9iaw9daq96a88t9e8g8l888a8k8q9f9sajawbfbibobbb7afaf9a9t8f9h7x997o8y7i8k7e8d7k8o859f8xa79hal9oak9oab9ra4a8a5azaabha7bf9oap8s9q7v8z7d8r7f917w9o8lad99av9tb1a9ayanakaq9xad969u8k9f899a8c9i8qa09bao9vbba6bna3bc9mai909j8k8t8e8j8j8m8q8t8t8v8r8r8m8j8l8c8u8d9h8na58wag91ag92ab95ab9baf9baa8y9p868t7c816z7p7e7z8h8n9q95ag99aj8za88l9v8b9r8e9x8ma48qa78sab90aj9haqa4asaiabaa9d9k8d8t7o8g7l8m81958m9p8za290a88ua78oa18n9w8x9v999u9h9u9n9z9sa79yaca0aa9w9t9k919789907q917o9b849s8qa997aj9dai95a78o9p899f8a9i8r9s9ka2aha9b3a7bca4bfa1bc9ub29ian91a58k9s8c9v8mae99ax9xb4aeatafa3a49ia39laka8b9azbtbdbyb7bpaqbfa9bc9wb69gal8w9r8d8y828o8b9594a4a5b4aubjaxb6afa99t9f9t97ad9cau9gax9dap97ah95aj9bat9lb09pay9hak939z8v9k979la09sao9tat9fae8q9p849b819j8laa9gb9acc4azckb6ceb2bsarawaa9v9n8x8x868d7r857t8d8a918y9y9nawa4bfa0b79gak8za08t9r8z9u98a19ca1949q8p988b8r888j8l8j978j9m8d9n859i829i869p8f9w8g9o7y90788e6w8b7c8w8l9xa7atbcaybkaeb19ia88q9m88987y8y7n8n7a8i778r7l9f8haa9lavadaraba49x9k9m9e9n9m9w9ya5a0a39l9s8w9i889c7v9b7w9g889l8l9p8t9t90a096a698a6949u8q9285867y7p8f7u998fa99bb7a3bsahbwabbi9qaq8v9v83977j8q7b8e7i89838c8u8l9l91a99haq9taza2b4a5b5a4b7a4bea7bna5bh9taq969n8k8q888e8g8t979pa4alaub4b5b5b5asb3abb09oal8t9u81947l8s7o938ea09hb6aibzazc3atbha6ai9m9l9f8z9g8f9a7v8y7f8q7b8v7o9f8ca48zao9gb59vbia9bsaobxb9bybqblblaoas9g9n8a8q7m8b7k8i81988taa9pbdagc5auccawc0aqbaa7ad9m9n94978t948u9c969s9taaalapbcatbqafbf9lao8va08i9q8h9r8k9t8j9p8a9e7z937s8v80928w9na7a7b4abbea3bc9wb79rb19jan8y9u7z8t6z826h806t8m7y9n9gaiamaqaxabal9oa1969r949s999v989u929x8zab96au9kb69wb59yam9i9t8w968i8z8j988v9l959o979c948s938b98839j8ba18uaj9cav9mb19qb29naw9dai8x9v898y7l807c7g7l7b897p958ea295aq9lax9jal909y8d9j849k889v8la392a79ka39v9wa29ta79ua99ua59n9t9a9h8w9e8s9t8zae95al92aa8q9o8d988f9h94aca4bdazc2bdc4b6bjapaqad9xa6949r84927a8h6x8e778z83a299b7a6buafbo9yav969z8u9k999j9u9ea1909w8n9p8j9r8qa194ae9eal9eal97ah8waa8ua997ac9ra99w9r9h8z8t8d8h8f8t949pa3atb1bwbmcmblcoazc0a2b197a08g947t8g7c86788a7j8t899n9aagaaaxazarb39zao92a48i9w8ha18rac8zaf8wa68j9r869h829i8d9o8y9s9i9k9o919j8k9f8f9j8k9n8m9g878v7l8g7b8o7r9o8vaza8c0b7c8bcbianab9m988s8m8d8e888b86878a878u8k9v9bb0a0bpadboa5b59naj98a793aa99aj9han9iae9a9u9298968u9h8o9t8pa48vac90ag91ag90ad8wa78m9v869e7q8y7n8v8a989d9tahaebcavbtb1bsasb9a2ac929d858s7k8p7g8z7o9c869r8za59paga7aoahauamb1apb2alavahalajafavabb69xay95a98f9k819a859m8qac9ib4a4bjabbha4b09sad9l9p9k909f8a967u967y9m8nah9mbgahc2arbzacbb9fad8g9g7y8x838o8e8d8h818h7x8n85908n9h949v9ga99nan9sb29vbd9zbia6bea5au9n9u8q8t7v857g817l8g8896969wa6adb0agbca2b49fak8va48k9u8e9p8b9o8c9s8ia08uac9aak9pah9x9y9s8z987z8r7j8s7p97859m8f9o8b9d7v8y7f8r7c8z7v9m8ua79raea5a3a49ra19ma09l9u9a9a8j8e7k7p6v7q6w8h7m9k8lah9fas9nae989p8o998h9e8s9u97a69ha69ma09y9wah9uau9mat97ag8p9v879f7y9d839q8ka992am99ak94a28u9f8u8y978v9q92ab9fas9rb09vaz9saq9fac8x9w8c9g7q8y7b8k7e8i7z8r8s989l9ta8a7afa7a49s9l999b929m99ac9nb29ubc9vb89rax9oan9lak9lak9kah9da895a0959z9ka6abacawa1at99a78h9r8b9y8uaq9rboancdb1chawc3aebh9yau9qa79k9c958b8m7l8f7l8v8a9t9daua9bgaibea0av98af8vae96ap9tava6ak9z9y9j9f9799959d9b9j9h9l9m9f9t99a698am9fb19rb99vax9da38i997x91809g8naa9nb7aobtbfbvbtbcblacax9aa88j9o829a7p8z7i8v7i917t9i8da690an9gal9na59o9j9k909k8x9v99a89jaa9d9t8p927u8g798d758q7h967z9g8f9e8n968p938u988z9b8t908b8e7u7x7u7x8n8la09hb8a5bqa7bg9pal8u9o83947p8x7m8w7m8u7n8s7v8t8h949f9fa79eaf96ad8yaa8vaa8zag97ao9eas9cak8xa28a9c7t8p7s8e858b8n8i988x9q9ba29ja49i9x959i8i927u8t7g8u7h94819m8ua69oana9azagaza8al9m9v8v938e8k8e8b8t8a9b889l8b9u8ja48vaf98au9qbda8brahbwajbuakbqaobfasasah9l9n878r7b8e788r7w9n8xao9ubeabboabbma0ba9lar9ba5949d8s8l8i888o8l9d9iacahb4b1bdavb3a6an9ca98ra28j9z8k9r8h9a868t7x8o7y8v889a8p9u9eafa6avb0b6bsb8c9b1c8akbo9qam8l9e7g8g6s836r8e7e9a8hag9pbdarbsbdbibdalav9oae94a58w9z8r9t8m9n8i9o8k9x8uag98av9iau9iab999h8w8u8r8q8z8z9895968x8q8a837k7t7b8e7w9m8wav9ubkabbka8b39uam9ga8919s8e907k826u7f6t7e7p849894an9wbea3bd9nar8ya58ka08na68uac8wac8ua68ua0959y9o9va19ja1949s8p9i8g9e8g9h8n9p8t9u8q9s8a9f7p8x7d8q7s908m9j9ia4a9alamasakala5a09h968s89887c7x6p7t6g816t8m7q9h8qab9iat9rat9faa8s9q8e9e8g9e8y9j9n9ja398a48sa08la18pa88yag95aj94ae8va68pa68sab93ab9d9x9a8z8s838j7w8y8l9z9sb5avbxbcc1b1bla7ay9bad8l9q80907i85737j707k7i8c8l9k9sanakb1amaka49p9r939w8xab92am96ak8za48k9n889g879l8f9v8ra591a899a49j9x9y9qac9iah97a88m9m7w917j8x7q9d8fab9gbfaicdb6cnb9c3auaxa09i958g8m7z8g7w8i818o8a8z8m9h92a79jax9sb79nay9eaf939v8v9k8z9p9a9z9e9z939g8g8o7w817u7w8i879f8ka08pa58n9y8f9o889k869i829b7s927m8z7s988l9x9yatbdbabzazbpa4as909r84927n8s7k8t7n907s9b819p8ia697ak9yala9aaa99wa49oa09n9z9ra19ta29m9y969p8j9h7z9a7r997z9g8i9q91a29fac9maf9ja8979s8o93898h88888q8b9j8oac9ab39yboafbxahbra2b59aa88d9e7r8z7o8y83938s989h979w96a89aaj9laza3bhalbsaqbtakboaabla4bh9wb19ja58w9088857z828f8r9d9uafasb4b5b8auaxa2ai98a48l9u899k83997z93869e8qa49iaxa5bdacb69yad9b9c8v8i8u82937y9a7x997r937k8z7j907o9a839v8san9jb9a6bjambeaxayawa8ai9d9s8f8w7j846y7r6v7x7b8p869x97b29xbka3b99rab959e8s8y8s908z96929990968x90908y9d909y90a68o9v83997m8s7j8s7u988b9m8i9k858z7g88707u7e878m90a19nav9qaz9fan90a88n9x8e9m80947e8h6t846p8a7b8x8j9t9vacama8ak9ma1909n8v9q97a49mai9sao9nap9eap97am95af96a2939k8u948l8x8k918s9e959p9g9p9i9a9d8l9680977x9k8da592aq9ob6a0bb9zb59mao93a28k9f858s7z88857w8i7u91879s8vaj9gaz9oax9eah8wa28la18qaf99ax9ub3a9asa8a19v9b9k8z9j929p9a9w9g9x9e9x9aa69ear9ob79rb49fac8s9e8b8y8d9992a6a2b7avbsb4bmatauaa9ya1999y8o9q82997j8r788k7b8x7w9o8paf9bas9dal93a38x9s9a9va6a5axa7b59uar96a28g9e7x907q8y7t97839o8ha58vaf9cam9xanacaeab9v9t95978n8u8j8v8r9a99a29vazadbnadbm9uax93a08g99858y848y8690858z828w838u8c8v8t8w9c8t9r8m9v8f9v8f9z8pab93ao99ak8u9v7x8u6z7y6g7l6o7q7k868j8f958g9e8e9g8d9i8d9g89987z8x7m8r7g8y7r9j8ha99faqa1ala09v9f908q8d898586888b8d8i8c8q8892879h899r8c9t8i9t8o9v8v9y92a699ae9dah9da9949n8n8r887u8175806u89748t7q9i8fa58xah92ae8t9z899g7s927n8u7w8t8i8w98929v9dah9saxa3b2a1aq9ja28r9d84957w9e839p8d9t8m9m8q998q908v989f9za9auaxbdb9bebab3baaqbeaab99iag8f9b7e8d6w84778s87a09hb9ajc0ayc0asbdabafa09oa0949x8l9o859g819k8ca18yao9kb59tb89oaw97ab8q9q8o9f91989d8z9c8j91828n7r8f7r8m879c91af9ybkarceb4clb3c8asbha8af9d9b8d8c7j7p737k797z808u9a9uapanbqarbta4b398ab8o9w8i9t8k9v8k9t8d9l859e849d8f9i919n9q9i9x8w9m88997v967y9f889n8a9g7v8t72866l846w8r819v9mauaub3b5aoas9za69b9k8t90888c7i7p6t7g6l7y728z83a69bb3a7b9a9aq9pa0969o909q969z9da09e9p9d999h8w9q8n9w8ja08ka18l9z8k9x8k9y8ma08oa28n9w8e9c7x8h7m7v7w7r8l869l8yam9tbeacbnacbb9raj8u9l7w8v758c6o7w6k7o6x7r7n868m8x9m9qada8aja6a89r9s9a9m929w97ag9baq96af8s9s8b96828z899b8q9v98ab9iae9ja89ka09u9ua69ha48m9f7l8n6z8f758y81a39abcadc5atc7ajbk9tal949m8t8t8l7z88767u6q7s6v897k948ja09aaj9gal99ai90af8zah9eal9vag9x9v9f918o89817u7r7u7y858i8o9c97aa9nb09tba9rb59naq9aa38p9g87938094879j8sa79nawalbebebeboapb69ha88c9e7p917k907n937p937o937p987w9h8b9p8v9w9l9wa09la1979z92a297a79ba38y9g848l76806o836v8o7n9g8m9z9ca19j9q9b9c91918q8u8i8o8e8h8e8d8s8l9o96as9ubja7bna1b29da48h997r8r7h8p7l8x7w9589988n9796979q92a28zab93ak99ar9dat9ear9aal92ad8q9z899d7r8o7j867q8088868y8p9q9cac9rai9pa5959g8b8v7q8s7m947u9j8c9w8za99maia4arafawafara0a6999b8i8k88898o8f9i8pa28qa58na08k9x8oa798aw9zbnakc1aqbyahbga5awa1aca39m9r8i907g8d6y8b788y85a199b1a3bka9bh9sav8y9z8c9d8e948r8w8w8l8y8i948s9j9a9z9qa99sa69d9u8o9h7z957k917o96849a8e958b8t808g7p8c7r8o8a9c97a1a6akb1aobga8b79hal8r9w85987j8n70886q846u8f7e968ba09caka4aia99n9p8i937v907x9d8d9t8ra08r9t8e9g7z987s997v9c8397878o807y7q7j7t7q8a8b8v8s908n8l7x7z797z798q7y9v8yau9rb79yau9ja48x9j8g9786907y8p7n897j807x878x8sa49eax9ob29fak8t9y8c9p8b9w8nac94aq9eat9faj9ba39f9m9j949k8p9j8i9j8i9m8m9r8t9y91a695ab90a88k9r819b81988l9i9e9za8akauayb1ayapaf9z9k958n8n808k7m8q7f8v7h937w9g8j9z97ai9nar9qaq9kai9cac9cab9sajajaqb7ahb69oaj8r9u869i829n8fa38xaj9aat9gaw9iaz9oay9xaqa19z9m8w91828r7x928i9x9jawagbkasboahba9raq90a68j9q8d9a898p7z867s807x8d8f8z919j9f9p9m9l9v9haa9jau9pbba0bja3bb9paj8v9k7x8r798c738e7f8w889k99a4aaafayaab49vax9eaj8xa58k9t8a9l869l8b9x8raj9eb49zbbaaawa49v9g8q8v848r86918h9a8n998h8z828r7r8u7p967y9o8ha291a59b9z9d9w9ia19oa59j9t8w8w7v7o706s6x6n7p758s7v9o8ia68ua68r9y8i9n899i859h849e839a87998q9h9o9tai9uar9hah8x9x8a9c7u917p907t97809h859m859i8499898y8j8s8x8v9f979y9nac9zaia2ae9ta49a9p8j997p8p6y876o826z8a7p8w8l9p9fae9wam9sa9989i8m8v8j8l8x8m9i8m9w8ma58rac8zaj99aq9eas9bak8ya58j9r8f9p8s9x9ia3a39ta4949q8g9g8b9r8xam9ybnaxcfbfcqbdcmb1caambtaab49s9z8z8n857q7t7p898i9a9pafapb8b4bhatb8a1as9bak93al98ak9aa8929t8t9n8t9t91a59bad9jab9la19n9m9v9aa594ag97ao99ak8xa1899b7m8v7g917x9t8xaxa4bvb4cabrc0brb4b7a1ah949s8e947r8j7a8674897g8z8aa69bb9a3bma9b59xa89g9h999b9g9l9s9v9t9q9f958u8g8i818q819d899u8f9w8e9n8a9d899e8h9n8p9s8l9e7x8j767u727s7w8i9h9jazabbsaibta4b99gai8q9v869d7o8v788h6y8d768o809c9aa1aeadawa7au9uam9mah9lai9qan9tap9mal97ab8p9x8c9l8b9e8j9b8w9f999p9ma09va89ya79u9w9l9b978g8t7o8o7c8u7n9g8iac9jb9afbxavc3aobm9xao8x9l848q7r847v7s877k8k7m93849v8wan9lb79ybea0bc9vb79pb59qb89yb8a6ata19u9e8n8p7w8h7y8x8n9r9lala9b3aibaadbda3bc9rb099a98n9a818h7r8b838z92a6a9bcb6bxbgbob3arah9n9z8p9l80997k8u788g708c748n7n9b8ca08yai9fat9uaxa9avatarb9ajbda6b69laj8s9p7z8y7f8m7d8u7u9m8qap9qblajbxazboayavai9y9y9b9n919h8z9e909h969u9jaka3bhalc2ambxa6b39d9z8l95888z8e9a8s9n8z9p8w9h8s978w929h9aad9ob39xbf9ybc9sb49may9iau9bai8q9r7w8v778975897y8v9a9kaf9zb0a1b19oam95a28o9q8j9q8m9y8saa91ao9gb5a4bjatbkb1b3araca59l9h91928t8y8v96939k99a099ac94af8vab8xad9bam9taya8b9afbcadb6a1ar9la5969h8w8r8t848t7p8y7q9f8ba595ay9ubga4bg9rat8za08a9k879m8p9w9ia4a8a3an9zawa0b5a7bcabbba5aw9la98w9r8h9u8mac96au9pav9uab9j9l999c9j9waeaxbcbtbzc4c1brbqb1bdabb69pau93a78d9b7p8o7h8p7x9g8xala0bjaqbvasbfaaae9p9h9o93a193ae95ak92ag8xaa8uaa8wad8zag8zaf8wa88r9w8r9k909e9g9b9v9ba2959u8p9b888z85948j9t9aava6bxauchb0c8aobda0a99a9c8r8u8f8k868f828f878m8q939p9paqa2b89saw93a68h9m889j8h9y90ag9cam98a98r9n8b93888u8q8u9c8r9m8f9k859g839j8a9u8na38p9w899d7o907j95829s99aoanb9bfb5bcahap9m9w8w998g8w868q808r7y94869t8ral9ib9aabialb7aeara4aia0aja4asaeb2anb3araraqa6ao9jai90ac8uad90aj9bat9mb29sb59sb29oav9gah949u8v9a918z9i90a69hb2a8byayciba";
const TW_LON = [
  285, 300, 315, 330, 345, 0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180, 195, 210, 225,
  240, 255, 270,
];
let TW = null;
function buildTW() {
  TW = [];
  for (let y = 1900; y <= 2100; y++)
    for (let i = 0; i < 24; i++) {
      const e = (parseInt(TERM_WARP.substr(((y - 1900) * 24 + i) * 2, 2), 36) - 300) / 10 / 1440; // 天(基准模型 − 真值)
      // 近似日期:小寒≈1/5,之后每项约15.2184天
      const g = jdFromGreg(y, 1, 5) + i * 15.2184 - 0.3333;
      const jb = termJDb(TW_LON[i], g);
      TW.push({ t: jb - e, e });
    }
}
function sunLon(jd) {
  if (!TW) buildTW();
  let lo = 0,
    hi = TW.length - 1;
  if (jd <= TW[0].t || jd >= TW[hi].t) return sunLonBase(jd + (jd <= TW[0].t ? TW[0].e : TW[hi].e));
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (TW[m].t <= jd) lo = m;
    else hi = m;
  }
  const a = TW[lo],
    b = TW[hi],
    e = a.e + ((b.e - a.e) * (jd - a.t)) / (b.t - a.t);
  return sunLonBase(jd + e);
}
function termJD(target, guess) {
  let jd = guess;
  for (let i = 0; i < 10; i++) {
    const diff = ((sunLon(jd) - target + 540) % 360) - 180;
    jd -= diff / 0.98565;
  }
  return jd;
}

/* ---- 农历(1900–2100) ---- */
const LUNAR = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0,
  0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, 0x0a4b0,
  0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, 0x0d4a0, 0x0ea50,
  0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0,
  0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0,
  0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260,
  0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558,
  0x0b540, 0x0b6a0, 0x195a6, 0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46,
  0x0ab60, 0x09570, 0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5,
  0x092e0, 0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954,
  0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, 0x076a3,
  0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, 0x056d0, 0x055b2,
  0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, 0x09370, 0x049f8, 0x04970,
  0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, 0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0,
  0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, 0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50,
  0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, 0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60,
  0x0a570, 0x054e4, 0x0d160, 0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0,
  0x0d150, 0x0f252, 0x0d520,
];
const lLeap = (y) => LUNAR[y - 1900] & 0xf;
const lLeapDays = (y) => (lLeap(y) ? (LUNAR[y - 1900] & 0x10000 ? 30 : 29) : 0);
const lMonthDays = (y, m) => (LUNAR[y - 1900] & (0x10000 >> m) ? 30 : 29);
function lYearDays(y) {
  let s = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) s += LUNAR[y - 1900] & i ? 1 : 0;
  return s + lLeapDays(y);
}
function solar2lunar(y, m, d) {
  let offset = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(1900, 0, 31)) / 864e5);
  let i,
    temp = 0;
  for (i = 1900; i < 2101 && offset > 0; i++) {
    temp = lYearDays(i);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    i--;
  }
  const year = i,
    leap = lLeap(year);
  let isLeap = false;
  for (i = 1; i < 13 && offset > 0; i++) {
    if (leap > 0 && i === leap + 1 && !isLeap) {
      --i;
      isLeap = true;
      temp = lLeapDays(year);
    } else temp = lMonthDays(year, i);
    if (isLeap && i === leap + 1) isLeap = false;
    offset -= temp;
  }
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) isLeap = false;
    else {
      isLeap = true;
      --i;
    }
  }
  if (offset < 0) {
    offset += temp;
    --i;
  }
  return { year, month: i, day: offset + 1, isLeap };
}
const LM = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
const LD = [
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
];
const lunarText = (l) =>
  gz(l.year - 4) + "年 " + (l.isLeap ? "闰" : "") + LM[l.month - 1] + "月" + LD[l.day - 1];

/* ---- 十神 ---- */
function shishen(dm, o) {
  const d = (GAN_WX[o] - GAN_WX[dm] + 5) % 5,
    same = dm % 2 === o % 2;
  return [
    same ? "比肩" : "劫财",
    same ? "食神" : "伤官",
    same ? "偏财" : "正财",
    same ? "七杀" : "正官",
    same ? "偏印" : "正印",
  ][d];
}

/* ---- 时间 ---- */
function calcTime(civ, opt) {
  const jdCivil = jdFromGreg(civ.y, civ.m, civ.d, civ.h, civ.mi, civ.s || 0);
  const jdUT = jdCivil - 8 / 24;
  const lon = sunLon(jdUT);
  const shift = opt && opt.solar ? (opt.lon - 120) * 4 + eot(jdUT) : 0;
  const jdLoc = jdCivil + shift / 1440;
  return { civ, jdCivil, jdUT, lon, shift, jdLoc, loc: fromJD(jdLoc) };
}

/* ---- 八字 ---- */
function calcBazi(t, gender) {
  const civ = fromJD(t.jdCivil + 1e-7),
    lon = t.lon,
    loc = t.loc;
  let yy = civ.y;
  if (civ.m <= 2 && lon < 315 && lon > 180) yy -= 1;
  const ys = (((yy - 4) % 10) + 10) % 10,
    yb = (((yy - 4) % 12) + 12) % 12;
  const mi = Math.floor(((((lon - 315) % 360) + 360) % 360) / 30);
  const mb = (2 + mi) % 12,
    ms = ((ys % 5) * 2 + 2 + mi) % 10;
  const dn = Math.floor(t.jdLoc + 0.5 + 1e-9);
  const dayIdx = (((dn + (loc.h >= 23 ? 1 : 0) + 49) % 60) + 60) % 60;
  const ds = dayIdx % 10,
    db = dayIdx % 12;
  const hb = Math.floor((loc.h + 1) / 2) % 12,
    hs = ((ds % 5) * 2 + hb) % 10;
  const hourIdx = ganzhiIdx(hs, hb);
  const pill = [
    { s: ys, b: yb },
    { s: ms, b: mb },
    { s: ds, b: db },
    { s: hs, b: hb },
  ];
  const wx = [0, 0, 0, 0, 0];
  pill.forEach((p) => {
    wx[GAN_WX[p.s]] += 1;
    CANG[p.b].forEach((g, i) => {
      wx[GAN_WX[g]] += [1, 0.5, 0.3][i];
    });
  });
  const dmw = GAN_WX[ds],
    supp = wx[dmw] + wx[(dmw + 4) % 5],
    total = wx.reduce((a, b) => a + b, 0);
  // 节 / 大运
  const prevT = (315 + 30 * mi) % 360,
    nextT = (prevT + 30) % 360;
  const jdPrev = termJD(prevT, t.jdUT - ((((lon - prevT) % 360) + 360) % 360) / 0.9856);
  const jdNext = termJD(nextT, t.jdUT + ((((nextT - lon) % 360) + 360) % 360) / 0.9856);
  const fwd = (ys % 2 === 0) === (gender === "M");
  const age = (fwd ? jdNext - t.jdUT : t.jdUT - jdPrev) / 3;
  const mIdx = ganzhiIdx(ms, mb),
    dayun = [];
  for (let i = 1; i <= 10; i++) {
    const idx = (((mIdx + (fwd ? i : -i)) % 60) + 60) % 60,
      sa = age + (i - 1) * 10;
    dayun.push({ idx, startAge: sa, yr: fromJD(t.jdUT + sa * 365.2422 + 8 / 24).y });
  }
  const bj = (jd) => fromJD(jd + 8 / 24);
  return {
    pill,
    yearNum: yy,
    dayIdx,
    hourIdx,
    dm: ds,
    wx,
    supp,
    total,
    fwd,
    age,
    dayun,
    jie: { prev: JIE[mi], prevT: bj(jdPrev), next: JIE[(mi + 1) % 12], nextT: bj(jdNext), mi },
  };
}

/* ---- 奇门遁甲(时家转盘·拆补法) ---- */
const JU = {
  冬至: [1, 7, 4],
  小寒: [2, 8, 5],
  大寒: [3, 9, 6],
  立春: [8, 5, 2],
  雨水: [9, 6, 3],
  惊蛰: [1, 7, 4],
  春分: [3, 9, 6],
  清明: [4, 1, 7],
  谷雨: [5, 2, 8],
  立夏: [4, 1, 7],
  小满: [5, 2, 8],
  芒种: [6, 3, 9],
  夏至: [9, 3, 6],
  小暑: [8, 2, 5],
  大暑: [7, 1, 4],
  立秋: [2, 5, 8],
  处暑: [1, 4, 7],
  白露: [9, 3, 6],
  秋分: [7, 1, 4],
  寒露: [6, 9, 3],
  霜降: [5, 8, 2],
  立冬: [6, 9, 3],
  小雪: [5, 8, 2],
  大雪: [4, 7, 1],
};
const RING = [1, 8, 3, 4, 9, 2, 7, 6];
const QSTAR = { 1: "蓬", 8: "任", 3: "冲", 4: "辅", 9: "英", 2: "芮", 7: "柱", 6: "心" };
const QDOOR = { 1: "休", 8: "生", 3: "伤", 4: "杜", 9: "景", 2: "死", 7: "惊", 6: "开" };
const PNAME = { 1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离" };
const PDIR = {
  1: "北",
  2: "西南",
  3: "东",
  4: "东南",
  5: "中",
  6: "西北",
  7: "西",
  8: "东北",
  9: "南",
};
const PNUM = { 1: "一", 2: "二", 3: "三", 4: "四", 5: "五", 6: "六", 7: "七", 8: "八", 9: "九" };
const PWX = { 1: 4, 2: 2, 3: 0, 4: 0, 5: 2, 6: 3, 7: 3, 8: 2, 9: 1 };
const DOORWX = { 休: 4, 生: 2, 伤: 0, 杜: 0, 景: 1, 死: 2, 惊: 3, 开: 3 };
const DOORTYPE = { 休: "吉", 生: "吉", 开: "吉", 景: "平", 杜: "平", 伤: "凶", 惊: "凶", 死: "凶" };
const STARTYPE = {
  蓬: "凶",
  芮: "凶",
  柱: "凶",
  英: "凶",
  任: "吉",
  冲: "吉",
  辅: "吉",
  心: "吉",
  禽: "吉",
};
const STAR_SC = { 蓬: -2, 芮: -2, 柱: -1, 英: -1, 任: 1, 冲: 1, 辅: 2, 心: 2, 禽: 1 };
const DOOR_SC = { 休: 2, 生: 2, 开: 2, 景: 0, 杜: -1, 伤: -2, 惊: -2, 死: -2 };
const PAL_ZHI = [1, 8, 8, 3, 4, 4, 9, 2, 2, 7, 6, 6];
const GEJU = [
  ["戊", "丙", "青龙返首", "吉"],
  ["丙", "戊", "飞鸟跌穴", "吉"],
  ["乙", "辛", "青龙逃走", "凶"],
  ["辛", "乙", "白虎猖狂", "凶"],
  ["丙", "庚", "荧入白", "凶"],
  ["庚", "丙", "白入荧", "凶"],
];
const GODS_Y = ["值符", "腾蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];
const GODS_N = ["值符", "腾蛇", "太阴", "六合", "勾陈", "朱雀", "九地", "九天"];
const ri = (p) => RING.indexOf(p === 5 ? 2 : p);
function calcQimen(lon, dayIdx, hourIdx, lonFu) {
  // 拆补法(通行软件口径):当前所处节气定阴阳遁与局数表,日柱所属旬的符头地支定上/中/下元
  const kNow = Math.floor(lon / 15) % 24;
  const k = Math.floor((lonFu == null ? lon : lonFu) / 15) % 24,
    term = TERMS[k],
    yang = k >= 18 || k <= 5;
  const fu = dayIdx - (dayIdx % 5),
    yuan = (fu / 5) % 3,
    ju = JU[term][yuan];
  const seq = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"],
    earth = {};
  for (let i = 0; i < 9; i++) {
    const p = yang ? ((ju - 1 + i) % 9) + 1 : ((((ju - 1 - i) % 9) + 9) % 9) + 1;
    earth[p] = seq[i];
  }
  const xun = Math.floor(hourIdx / 10),
    steps = hourIdx % 10;
  const dun = ["戊", "己", "庚", "辛", "壬", "癸"][xun];
  const p0 = +Object.keys(earth).find((p) => earth[p] === dun),
    p0r = p0 === 5 ? 2 : p0;
  const hs = hourIdx % 10,
    tstem = hs === 0 ? dun : GAN[hs];
  let q = +Object.keys(earth).find((p) => earth[p] === tstem);
  if (q === 5) q = 2;
  // 九星
  const shiftS = (ri(q) - ri(p0r) + 8) % 8,
    heaven = {};
  RING.forEach((op, i) => {
    const np = RING[(i + shiftS) % 8];
    heaven[np] = {
      star: QSTAR[op],
      stem: earth[op],
      extra: op === 2 ? { star: "禽", stem: earth[5] } : null,
    };
  });
  // 八门
  const r = yang ? ((p0 - 1 + steps) % 9) + 1 : ((((p0 - 1 - steps) % 9) + 9) % 9) + 1,
    rr = r === 5 ? 2 : r;
  const shiftD = (ri(rr) - ri(p0r) + 8) % 8,
    doors = {};
  RING.forEach((op, i) => {
    doors[RING[(i + shiftD) % 8]] = QDOOR[op];
  });
  // 八神
  const gl = yang ? GODS_Y : GODS_N,
    dir = yang ? 1 : -1,
    gods = {};
  gl.forEach((g, i) => {
    gods[RING[(((ri(q) + dir * i) % 8) + 8) % 8]] = g;
  });
  // 空亡 / 驿马
  const head = (hourIdx - (hourIdx % 10)) % 12,
    kongB = [(head + 10) % 12, (head + 11) % 12];
  const kongP = [...new Set(kongB.map((b) => PAL_ZHI[b]))];
  const hb = hourIdx % 12,
    horseB = [2, 11, 8, 5][hb % 4],
    horseP = PAL_ZHI[horseB];
  const cells = {};
  let score = {};
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((p) => {
    const c = {
      p,
      earth: earth[p],
      hs: heaven[p].stem,
      star: heaven[p].star,
      extra: heaven[p].extra,
      door: doors[p],
      god: gods[p],
      tags: [],
      geju: [],
    };
    if (p === 2 && earth[5]) c.center = earth[5];
    GEJU.forEach(([a, b, n, t]) => {
      if (c.hs === a && c.earth === b) c.geju.push({ n, t });
    });
    if ("乙丙丁".includes(c.hs) && DOORTYPE[c.door] === "吉")
      c.geju.push({ n: "奇门吉格", t: "吉" });
    const dw = DOORWX[c.door],
      pw = PWX[p];
    if ((pw - dw + 5) % 5 === 2) c.tags.push({ n: "门迫", t: "凶" });
    if (kongP.includes(p)) c.tags.push({ n: "空亡", t: "空" });
    if (horseP === p) c.tags.push({ n: "驿马", t: "马" });
    if (p === q) c.tags.push({ n: "值符", t: "符" });
    if (p === rr) c.tags.push({ n: "值使", t: "使" });
    let sc = (STAR_SC[c.star] || 0) + DOOR_SC[c.door];
    c.geju.forEach((g) => {
      sc += g.t === "吉" ? 2 : -2;
    });
    c.tags.forEach((g) => {
      if (g.n === "门迫") sc -= 1;
      if (g.n === "空亡") sc -= 1;
    });
    c.score = sc;
    cells[p] = c;
  });
  cells[5] = { p: 5, earth: earth[5], center: true, tags: [], geju: [] };
  const ranked = [1, 2, 3, 4, 6, 7, 8, 9].sort((a, b) => cells[b].score - cells[a].score);
  const zfStar = p0 === 5 ? "禽" : QSTAR[p0];
  return {
    yang,
    ju,
    term,
    k,
    kNow,
    yuan,
    dun,
    p0,
    q,
    rr,
    steps,
    xun,
    zfStar,
    zsDoor: QDOOR[p0r],
    cells,
    earth,
    kongB,
    kongP,
    horseB,
    horseP,
    fuyin: shiftS === 0,
    fanyin: shiftS === 4,
    best: ranked.slice(0, 2),
    worst: ranked.slice(-2).reverse(),
    yuanName: ["上元", "中元", "下元"][yuan],
    hourGZ: gz(hourIdx),
  };
}

/* ---- 易经 · 梅花易数 ---- */
const TRI = [
  null,
  { n: "乾", img: "天", wx: 3, l: [1, 1, 1] },
  { n: "兑", img: "泽", wx: 3, l: [1, 1, 0] },
  { n: "离", img: "火", wx: 1, l: [1, 0, 1] },
  { n: "震", img: "雷", wx: 0, l: [1, 0, 0] },
  { n: "巽", img: "风", wx: 0, l: [0, 1, 1] },
  { n: "坎", img: "水", wx: 4, l: [0, 1, 0] },
  { n: "艮", img: "山", wx: 2, l: [0, 0, 1] },
  { n: "坤", img: "地", wx: 2, l: [0, 0, 0] },
];
const TRI_KEY = { 111: 1, 110: 2, 101: 3, 100: 4, "011": 5, "010": 6, "001": 7, "000": 8 };
const HEX = [
  ["乾为天", "天泽履", "天火同人", "天雷无妄", "天风姤", "天水讼", "天山遁", "天地否"],
  ["泽天夬", "兑为泽", "泽火革", "泽雷随", "泽风大过", "泽水困", "泽山咸", "泽地萃"],
  ["火天大有", "火泽睽", "离为火", "火雷噬嗑", "火风鼎", "火水未济", "火山旅", "火地晋"],
  ["雷天大壮", "雷泽归妹", "雷火丰", "震为雷", "雷风恒", "雷水解", "雷山小过", "雷地豫"],
  ["风天小畜", "风泽中孚", "风火家人", "风雷益", "巽为风", "风水涣", "风山渐", "风地观"],
  ["水天需", "水泽节", "水火既济", "水雷屯", "水风井", "坎为水", "水山蹇", "水地比"],
  ["山天大畜", "山泽损", "山火贲", "山雷颐", "山风蛊", "山水蒙", "艮为山", "山地剥"],
  ["地天泰", "地泽临", "地火明夷", "地雷复", "地风升", "地水师", "地山谦", "坤为地"],
];
const KW =
  "乾为天 坤为地 水雷屯 山水蒙 水天需 天水讼 地水师 水地比 风天小畜 天泽履 地天泰 天地否 天火同人 火天大有 地山谦 雷地豫 泽雷随 山风蛊 地泽临 风地观 火雷噬嗑 山火贲 山地剥 地雷复 天雷无妄 山天大畜 山雷颐 泽风大过 坎为水 离为火 泽山咸 雷风恒 天山遁 雷天大壮 火地晋 地火明夷 风火家人 火泽睽 水山蹇 雷水解 山泽损 风雷益 泽天夬 天风姤 泽地萃 地风升 泽水困 水风井 泽火革 火风鼎 震为雷 艮为山 风山渐 雷泽归妹 雷火丰 火山旅 巽为风 兑为泽 风水涣 水泽节 风泽中孚 雷山小过 水火既济 火水未济".split(
    " ",
  );
const HEXTXT = {
  乾为天: "自强不息 · 元亨利贞",
  坤为地: "厚德载物 · 柔顺承天",
  水雷屯: "万事初生 · 艰难草创",
  山水蒙: "启蒙求教 · 果行育德",
  水天需: "等待蓄养 · 云上于天",
  天水讼: "争讼是非 · 慎始止争",
  地水师: "统众行师 · 容民畜众",
  水地比: "亲比辅佐 · 诚信相依",
  风天小畜: "小有蓄积 · 密云不雨",
  天泽履: "履虎尾 · 如履薄冰",
  地天泰: "天地交泰 · 通达顺畅",
  天地否: "闭塞不通 · 守正待时",
  天火同人: "同心协力 · 志同道合",
  火天大有: "盛大丰有 · 遏恶扬善",
  地山谦: "谦逊自牧 · 卑以自持",
  雷地豫: "豫悦预备 · 顺势而动",
  泽雷随: "随时而动 · 顺势而为",
  山风蛊: "整治积弊 · 振民育德",
  地泽临: "监临教化 · 教思无穷",
  风地观: "观察省视 · 观我生",
  火雷噬嗑: "咬合除障 · 明罚敕法",
  山火贲: "文饰修饰 · 文明以止",
  山地剥: "剥落衰退 · 顺而止之",
  地雷复: "一阳来复 · 反复其道",
  天雷无妄: "无妄之灾 · 顺其自然",
  山天大畜: "大有蓄积 · 日新其德",
  山雷颐: "颐养之道 · 慎言节饮",
  泽风大过: "栋梁弯曲 · 非常之时",
  坎为水: "重重险陷 · 习坎有孚",
  离为火: "光明附丽 · 柔顺中正",
  泽山咸: "感应相通 · 以虚受人",
  雷风恒: "恒久持守 · 立不易方",
  天山遁: "隐退避世 · 以退为进",
  雷天大壮: "强盛壮大 · 非礼勿履",
  火地晋: "晋升光明 · 自昭明德",
  地火明夷: "光明受损 · 晦而用明",
  风火家人: "家道端正 · 言有物行有恒",
  火泽睽: "背离乖违 · 求同存异",
  水山蹇: "艰难险阻 · 反身修德",
  雷水解: "解困缓难 · 赦过宥罪",
  山泽损: "减损克己 · 惩忿窒欲",
  风雷益: "增益获益 · 见善则迁",
  泽天夬: "决断果敢 · 扬于王庭",
  天风姤: "不期而遇 · 防微杜渐",
  泽地萃: "荟萃聚集 · 顺天命聚",
  地风升: "循序上升 · 积小成高",
  泽水困: "困顿受阻 · 守志亨通",
  水风井: "井养不穷 · 劳民劝相",
  泽火革: "变革更新 · 顺天应人",
  火风鼎: "革故鼎新 · 稳重立业",
  震为雷: "震动惊惧 · 恐惧修省",
  艮为山: "止而不妄 · 思不出位",
  风山渐: "循序渐进 · 女归吉",
  雷泽归妹: "归嫁婚配 · 永终知敝",
  雷火丰: "丰盛盛大 · 宜日中天",
  火山旅: "羁旅在外 · 谨慎守正",
  巽为风: "顺从入微 · 申命行事",
  兑为泽: "喜悦和乐 · 朋友讲习",
  风水涣: "涣散离散 · 聚而不散",
  水泽节: "节制有度 · 不可苦节",
  风泽中孚: "诚信感通 · 信及豚鱼",
  雷山小过: "小有过越 · 宜下不宜上",
  水火既济: "事已成 · 思患预防",
  火水未济: "事未完成 · 慎辨物居",
};
const trigOf = (l) => TRI_KEY[l.join("")];
function hexInfo(lines) {
  const lo = trigOf(lines.slice(0, 3)),
    up = trigOf(lines.slice(3, 6));
  const name = HEX[up - 1][lo - 1];
  return { up, lo, name, kw: KW.indexOf(name) + 1, txt: HEXTXT[name], lines: lines.slice() };
}
function hexFromTri(up, lo) {
  return TRI[lo].l.concat(TRI[up].l);
}
function tiyong(ti, yong) {
  const a = TRI[ti].wx,
    b = TRI[yong].wx,
    d = (b - a + 5) % 5;
  return [
    ["体用比和", "吉", "同气相求,主事平顺、助力相合。"],
    ["体生用", "平偏耗", "体去生用,气泄于外,主耗费、付出多于所得。"],
    ["体克用", "吉", "体制用,主事可自主掌控、有所得。"],
    ["用克体", "凶", "用制体,主受外力所制、阻滞或压力。"],
    ["用生体", "大吉", "用来生体,主得助力、顺遂有成。"],
  ][d];
}
function calcMeihua(lunar, hb) {
  const yn = ((((lunar.year - 4) % 12) + 12) % 12) + 1,
    m = lunar.month,
    d = lunar.day,
    h = hb + 1;
  const s3 = yn + m + d,
    s4 = s3 + h;
  const up = s3 % 8 || 8,
    lo = s4 % 8 || 8,
    mv = s4 % 6 || 6;
  const lines = hexFromTri(up, lo);
  const ben = hexInfo(lines);
  const hu = hexInfo([lines[1], lines[2], lines[3], lines[2], lines[3], lines[4]]);
  const bl = lines.slice();
  bl[mv - 1] = 1 - bl[mv - 1];
  const bian = hexInfo(bl);
  const inLower = mv <= 3,
    ti = inLower ? up : lo,
    yong = inLower ? lo : up;
  return {
    yn,
    m,
    d,
    h,
    s3,
    s4,
    up,
    lo,
    mv,
    ben,
    hu,
    bian,
    ti,
    yong,
    inLower,
    verdict: tiyong(ti, yong),
    moving: [mv - 1],
  };
}
function castCoins(rand) {
  // rand():0/1
  const out = [];
  for (let i = 0; i < 6; i++) {
    let s = 0;
    for (let j = 0; j < 3; j++) s += rand() ? 3 : 2;
    out.push(s);
  }
  return out;
}
function coinsToHex(sums) {
  const lines = sums.map((s) => (s === 7 || s === 9 ? 1 : 0)),
    mv = [];
  const bl = lines.slice();
  sums.forEach((s, i) => {
    if (s === 6 || s === 9) {
      mv.push(i);
      bl[i] = 1 - bl[i];
    }
  });
  return { ben: hexInfo(lines), bian: hexInfo(bl), moving: mv, sums };
}

/* ---- 紫微斗数(简盘) ---- */
const PALNAME = [
  "命宫",
  "兄弟",
  "夫妻",
  "子女",
  "财帛",
  "疾厄",
  "迁移",
  "交友",
  "官禄",
  "田宅",
  "福德",
  "父母",
];
const JUNAME = { 2: "水二局", 3: "木三局", 4: "金四局", 5: "土五局", 6: "火六局" };
const SIHUA = {
  0: ["廉贞", "破军", "武曲", "太阳"],
  1: ["天机", "天梁", "紫微", "太阴"],
  2: ["天同", "天机", "文昌", "廉贞"],
  3: ["太阴", "天同", "天机", "巨门"],
  4: ["贪狼", "太阴", "右弼", "天机"],
  5: ["武曲", "贪狼", "天梁", "文曲"],
  6: ["太阳", "武曲", "太阴", "天同"],
  7: ["巨门", "太阳", "文曲", "文昌"],
  8: ["天梁", "紫微", "左辅", "武曲"],
  9: ["破军", "巨门", "太阴", "贪狼"],
};
const mod = (a, n) => ((a % n) + n) % n;
function ziweiPos(day, ju) {
  let x = 0;
  while ((day + x) % ju !== 0) x++;
  const q = (day + x) / ju;
  return mod(2 + (x % 2 === 0 ? q + x : q - x) - 1, 12);
}
function calcZiwei(lunar, hb, gender) {
  const ys = mod(lunar.year - 4, 10);
  let m = lunar.month;
  if (lunar.isLeap && lunar.day > 15) m = (m % 12) + 1;
  const ming = mod(2 + m - 1 - hb, 12),
    shen = mod(2 + m - 1 + hb, 12);
  const start = ((ys % 5) * 2 + 2) % 10,
    stemOf = (b) => (start + mod(b - 2, 12)) % 10;
  const mIdx = ganzhiIdx(stemOf(ming), ming),
    nyName = NAYIN[mIdx >> 1],
    wxc = nyName[nyName.length - 1];
  const ju = { 水: 2, 木: 3, 金: 4, 土: 5, 火: 6 }[wxc];
  const z = ziweiPos(lunar.day, ju),
    tf = mod(4 - z, 12);
  const stars = {};
  const put = (n, b, t) => {
    (stars[mod(b, 12)] = stars[mod(b, 12)] || []).push({ n, t });
  };
  [
    ["紫微", 0],
    ["天机", -1],
    ["太阳", -3],
    ["武曲", -4],
    ["天同", -5],
    ["廉贞", -8],
  ].forEach(([n, o]) => put(n, z + o, "main"));
  [
    ["天府", 0],
    ["太阴", 1],
    ["贪狼", 2],
    ["巨门", 3],
    ["天相", 4],
    ["天梁", 5],
    ["七杀", 6],
    ["破军", 10],
  ].forEach(([n, o]) => put(n, tf + o, "main"));
  put("左辅", 4 + m - 1, "aux");
  put("右弼", 10 - (m - 1), "aux");
  put("文昌", 10 - hb, "aux");
  put("文曲", 4 + hb, "aux");
  const sh = SIHUA[ys],
    lab = ["禄", "权", "科", "忌"];
  Object.values(stars).forEach((arr) =>
    arr.forEach((s) => {
      const i = sh.indexOf(s.n);
      if (i >= 0) s.h = lab[i];
    }),
  );
  const fwd = (ys % 2 === 0) === (gender === "M");
  const pal = [];
  for (let b = 0; b < 12; b++) {
    const k = fwd ? mod(b - ming, 12) : mod(ming - b, 12);
    pal.push({
      b,
      name: PALNAME[mod(ming - b, 12)],
      stem: stemOf(b),
      stars: stars[b] || [],
      isMing: b === ming,
      isShen: b === shen,
      dx: [ju + 10 * k, ju + 10 * k + 9],
    });
  }
  return {
    ys,
    m,
    ming,
    shen,
    ju,
    juName: JUNAME[ju],
    nyName,
    z,
    tf,
    pal,
    fwd,
    sihua: sh.map((n, i) => lab[i] + ":" + n),
    lunarYear: lunar.year,
  };
}

/* ---- 汇总 ---- */
function computeAll(civ, opt) {
  const t = calcTime(civ, opt);
  const bz = calcBazi(t, opt.gender);
  const cal = fromJD(t.jdLoc + (t.loc.h >= 23 ? 1 : 0) + 1e-7);
  const lunar = solar2lunar(cal.y, cal.m, cal.d);
  const qm = calcQimen(t.lon, bz.dayIdx, bz.hourIdx);
  const mh = calcMeihua(lunar, bz.pill[3].b);
  const zw = calcZiwei(lunar, bz.pill[3].b, opt.gender);
  return { t, civ, bz, lunar, qm, mh, zw, opt };
}

/* =====================================================================
   八字深度分析:十二长生 · 神煞 · 合冲刑害 · 旺衰/格局/喜用 · 流年流月 · 胎元命宫身宫 · 合盘
   说明:神煞与旺衰取常见通行口径,为算法演示;流派差异很大,不作命理断语。
   ===================================================================== */
const CS_START = [11, 6, 2, 9, 2, 9, 5, 0, 8, 3]; // 长生所在地支:甲亥 乙午 丙寅 丁酉 戊寅 己酉 庚巳 辛子 壬申 癸卯
const CS_NAME = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
function changsheng(gan, zhi) {
  const st = CS_START[gan],
    d = gan % 2 === 0 ? (zhi - st + 12) % 12 : (st - zhi + 12) % 12;
  return CS_NAME[d];
}
const xunkongOf = (idx) => {
  const head = (idx - (idx % 10) + 120) % 12;
  return [(head + 10) % 12, (head + 11) % 12];
};
const RELN = ["同我", "我生", "我克", "克我", "生我"];
const wxRel = (a, b) => (GAN_WX[b] - GAN_WX[a] + 5) % 5; // 以 a 为日主看 b 的五行关系:0同 1我生 2我克 3克我 4生我

/* --- 关系表 --- */
const G_HE = [
  [0, 5, "土"],
  [1, 6, "金"],
  [2, 7, "水"],
  [3, 8, "木"],
  [4, 9, "火"],
];
const G_CHONG = [
  [0, 6],
  [1, 7],
  [2, 8],
  [3, 9],
];
const Z_HE6 = [
  [0, 1, "土"],
  [2, 11, "木"],
  [3, 10, "火"],
  [4, 9, "金"],
  [5, 8, "水"],
  [6, 7, "火"],
];
const Z_SANHE = [
  [8, 0, 4, "水"],
  [2, 6, 10, "火"],
  [5, 9, 1, "金"],
  [11, 3, 7, "木"],
];
const Z_SANHUI = [
  [2, 3, 4, "木"],
  [5, 6, 7, "火"],
  [8, 9, 10, "金"],
  [11, 0, 1, "水"],
];
const Z_CHONG = [
  [0, 6],
  [1, 7],
  [2, 8],
  [3, 9],
  [4, 10],
  [5, 11],
];
const Z_HAI = [
  [0, 7],
  [1, 6],
  [2, 5],
  [3, 4],
  [8, 11],
  [9, 10],
];
const Z_PO = [
  [0, 9],
  [1, 4],
  [2, 11],
  [3, 6],
  [5, 8],
  [7, 10],
];
const Z_XING3 = [
  [2, 5, 8, "无恩之刑"],
  [1, 10, 7, "恃势之刑"],
];
const Z_XING2 = [[0, 3, "无礼之刑"]];
const Z_ZIXING = [4, 6, 9, 11];
const PNAMES = ["年", "月", "日", "时"];

function relations(bz) {
  const P = bz.pill,
    out = [];
  const S = P.map((p) => p.s),
    B = P.map((p) => p.b);
  for (let i = 0; i < 4; i++)
    for (let j = i + 1; j < 4; j++) {
      G_HE.forEach(([a, b, h]) => {
        if ((S[i] === a && S[j] === b) || (S[i] === b && S[j] === a))
          out.push({
            k: "天干五合",
            t: "合",
            txt: `${PNAMES[i]}${GAN[S[i]]}${PNAMES[j]}${GAN[S[j]]}合化${h}`,
            cols: [i, j],
            tag: "干",
          });
      });
      G_CHONG.forEach(([a, b]) => {
        if ((S[i] === a && S[j] === b) || (S[i] === b && S[j] === a))
          out.push({
            k: "天干相克",
            t: "冲",
            txt: `${PNAMES[i]}${GAN[S[i]]}克冲${PNAMES[j]}${GAN[S[j]]}`,
            cols: [i, j],
            tag: "干",
          });
      });
      Z_HE6.forEach(([a, b, h]) => {
        if ((B[i] === a && B[j] === b) || (B[i] === b && B[j] === a))
          out.push({
            k: "地支六合",
            t: "合",
            txt: `${PNAMES[i]}${ZHI[B[i]]}${PNAMES[j]}${ZHI[B[j]]}六合(${h})`,
            cols: [i, j],
            tag: "支",
          });
      });
      Z_CHONG.forEach(([a, b]) => {
        if ((B[i] === a && B[j] === b) || (B[i] === b && B[j] === a))
          out.push({
            k: "地支六冲",
            t: "冲",
            txt: `${PNAMES[i]}${ZHI[B[i]]}冲${PNAMES[j]}${ZHI[B[j]]}`,
            cols: [i, j],
            tag: "支",
          });
      });
      Z_HAI.forEach(([a, b]) => {
        if ((B[i] === a && B[j] === b) || (B[i] === b && B[j] === a))
          out.push({
            k: "地支相害",
            t: "害",
            txt: `${PNAMES[i]}${ZHI[B[i]]}害${PNAMES[j]}${ZHI[B[j]]}`,
            cols: [i, j],
            tag: "支",
          });
      });
      Z_PO.forEach(([a, b]) => {
        if ((B[i] === a && B[j] === b) || (B[i] === b && B[j] === a))
          out.push({
            k: "地支相破",
            t: "破",
            txt: `${PNAMES[i]}${ZHI[B[i]]}破${PNAMES[j]}${ZHI[B[j]]}`,
            cols: [i, j],
            tag: "支",
          });
      });
      Z_XING2.forEach(([a, b, n]) => {
        if ((B[i] === a && B[j] === b) || (B[i] === b && B[j] === a))
          out.push({
            k: "相刑",
            t: "刑",
            txt: `${PNAMES[i]}${ZHI[B[i]]}刑${PNAMES[j]}${ZHI[B[j]]}(${n})`,
            cols: [i, j],
            tag: "支",
          });
      });
      if (B[i] === B[j] && Z_ZIXING.includes(B[i]))
        out.push({
          k: "自刑",
          t: "刑",
          txt: `${PNAMES[i]}${PNAMES[j]}${ZHI[B[i]]}${ZHI[B[j]]}自刑`,
          cols: [i, j],
          tag: "支",
        });
    }
  const setB = new Set(B);
  Z_SANHE.forEach(([a, b, c, h]) => {
    const has = [a, b, c].filter((x) => setB.has(x));
    if (has.length === 3)
      out.push({
        k: "三合局",
        t: "合",
        txt: `${ZHI[a]}${ZHI[b]}${ZHI[c]}三合${h}局`,
        cols: [],
        tag: "支",
      });
    else if (has.length === 2 && setB.has(b)) {
      out.push({
        k: "半合",
        t: "合",
        txt: `${has.map((x) => ZHI[x]).join("")}半合${h}`,
        cols: [],
        tag: "支",
      });
    }
  });
  Z_SANHUI.forEach(([a, b, c, h]) => {
    if ([a, b, c].every((x) => setB.has(x)))
      out.push({
        k: "三会局",
        t: "合",
        txt: `${ZHI[a]}${ZHI[b]}${ZHI[c]}三会${h}方`,
        cols: [],
        tag: "支",
      });
  });
  Z_XING3.forEach(([a, b, c, n]) => {
    const has = [a, b, c].filter((x) => setB.has(x));
    if (has.length === 3)
      out.push({ k: "三刑", t: "刑", txt: `${ZHI[a]}${ZHI[b]}${ZHI[c]}${n}`, cols: [], tag: "支" });
    else if (has.length === 2)
      out.push({
        k: "半刑",
        t: "刑",
        txt: `${has.map((x) => ZHI[x]).join("")}相刑(${n},未全)`,
        cols: [],
        tag: "支",
      });
  });
  return out;
}

/* --- 神煞(通行查表) --- */
const TIANYI = {
  0: [1, 7],
  4: [1, 7],
  6: [1, 7],
  1: [0, 8],
  5: [0, 8],
  2: [11, 9],
  3: [11, 9],
  8: [5, 3],
  9: [5, 3],
  7: [6, 2],
};
const TAIJI = {
  0: [0, 6],
  1: [0, 6],
  2: [3, 9],
  3: [3, 9],
  4: [4, 10, 1, 7],
  5: [4, 10, 1, 7],
  6: [2, 11],
  7: [2, 11],
  8: [5, 8],
  9: [5, 8],
};
const WENCHANG = [5, 6, 8, 9, 8, 9, 11, 0, 2, 3];
const LUSHEN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
const YANGREN = { 0: 3, 2: 6, 4: 6, 6: 9, 8: 0 };
const SAN_HE_GRP = (b) =>
  [
    [8, 0, 4],
    [2, 6, 10],
    [5, 9, 1],
    [11, 3, 7],
  ].findIndex((g) => g.includes(b));
const YIMA = [2, 8, 11, 5],
  TAOHUA = [9, 3, 6, 0],
  HUAGAI = [4, 10, 1, 7],
  JIANGXING = [0, 6, 9, 3],
  JIESHA = [5, 11, 2, 8];
// 组序对应:申子辰(0) 寅午戌(1) 巳酉丑(2) 亥卯未(3)
const GUCHEN = (b) => [2, 2, 5, 5, 5, 8, 8, 8, 11, 11, 11, 2][b]; // 亥子丑→寅 寅卯辰→巳 巳午未→申 申酉戌→亥
const GUASU = (b) => [10, 10, 1, 1, 1, 4, 4, 4, 7, 7, 7, 10][b];
const HONGLUAN = (b) => (((3 - b) % 12) + 12) % 12;
function tianDe(mb) {
  // 返回 {type:'gan'|'zhi',v}
  // 寅丁 卯申(支) 辰壬 巳辛 午亥(支) 未甲 申癸 酉寅(支) 戌丙 亥乙 子巳(支) 丑庚
  const m = {
    2: ["g", 3],
    3: ["z", 8],
    4: ["g", 8],
    5: ["g", 7],
    6: ["z", 11],
    7: ["g", 0],
    8: ["g", 9],
    9: ["z", 2],
    10: ["g", 2],
    11: ["g", 1],
    0: ["z", 5],
    1: ["g", 6],
  };
  return m[mb];
}
function yueDe(mb) {
  const g = SAN_HE_GRP(mb);
  return g < 0 ? null : [8, 2, 6, 0][g];
} // 申子辰壬 寅午戌丙 巳酉丑庚 亥卯未甲
function shensha(bz) {
  const P = bz.pill,
    dg = bz.dm,
    S = P.map((p) => p.s),
    B = P.map((p) => p.b),
    res = [];
  const put = (name, zhis, tone, desc) => {
    const hit = [];
    B.forEach((b, i) => {
      if (zhis.includes(b)) hit.push(PNAMES[i]);
    });
    if (hit.length) res.push({ n: name, where: hit, tone, desc });
  };
  put("天乙贵人", TIANYI[dg] || [], "吉", "逢凶化吉、得人相助之象(日干起,年干另论)");
  put("太极贵人", TAIJI[dg] || [], "吉", "好学敏悟、易得机缘");
  put("文昌贵人", [WENCHANG[dg]], "吉", "聪慧利学");
  put("禄神", [LUSHEN[dg]], "吉", "自坐之禄,主衣食根基");
  if (YANGREN[dg] !== undefined) put("羊刃", [YANGREN[dg]], "凶", "刚烈过盛,宜制不宜逢冲");
  const yb = B[2],
    nb = B[0];
  // 驿马/桃花/华盖/将星/劫煞:以日支、年支各取一次
  const grpDay = SAN_HE_GRP(yb),
    grpYear = SAN_HE_GRP(nb);
  const uniq = (a) => [...new Set(a)];
  const tri = (tab, name, tone, desc) => put(name, uniq([tab[grpDay], tab[grpYear]]), tone, desc);
  tri(YIMA, "驿马", "动", "主奔波迁动、出行变动");
  tri(TAOHUA, "桃花(咸池)", "情", "人缘与异性缘,亦主情感波折");
  tri(HUAGAI, "华盖", "静", "孤高、宗教艺术玄学之缘");
  tri(JIANGXING, "将星", "吉", "统领担当");
  tri(JIESHA, "劫煞", "凶", "主破耗、突发之扰");
  put("孤辰", [GUCHEN(nb)], "凶", "独处倾向(以年支起)");
  put("寡宿", [GUASU(nb)], "凶", "孤寂倾向(以年支起)");
  put("红鸾", [HONGLUAN(nb)], "情", "姻缘之星(以年支起)");
  put("天喜", [(HONGLUAN(nb) + 6) % 12], "情", "喜庆之星(以年支起)");
  // 月德 / 天德
  const my = yueDe(B[1]);
  if (my !== null && S.includes(my))
    res.push({
      n: "月德贵人",
      where: S.map((s, i) => (s === my ? PNAMES[i] : null)).filter(Boolean),
      tone: "吉",
      desc: "福德庇荫,遇难呈祥",
    });
  const td = tianDe(B[1]);
  if (td) {
    if (td[0] === "g") {
      if (S.includes(td[1]))
        res.push({
          n: "天德贵人",
          where: S.map((s, i) => (s === td[1] ? PNAMES[i] : null)).filter(Boolean),
          tone: "吉",
          desc: "天赐福荫",
        });
    } else if (B.includes(td[1]))
      res.push({
        n: "天德贵人",
        where: B.map((b, i) => (b === td[1] ? PNAMES[i] : null)).filter(Boolean),
        tone: "吉",
        desc: "天赐福荫",
      });
  }
  // 魁罡
  if (["庚辰", "庚戌", "壬辰", "戊戌"].includes(GAN[S[2]] + ZHI[B[2]]))
    res.push({ n: "魁罡日", where: ["日"], tone: "刚", desc: "性刚决断,福祸皆烈" });
  // 空亡
  const kD = xunkongOf(bz.dayIdx),
    kY = xunkongOf(ganzhiIdx(S[0], B[0]));
  const kongHit = [];
  B.forEach((b, i) => {
    if (i !== 2 && kD.includes(b)) kongHit.push(PNAMES[i] + "(日空)");
  });
  B.forEach((b, i) => {
    if (i !== 0 && kY.includes(b)) kongHit.push(PNAMES[i] + "(年空)");
  });
  if (kongHit.length)
    res.push({
      n: "空亡",
      where: kongHit,
      tone: "空",
      desc: `日柱旬空 ${kD.map((x) => ZHI[x]).join("")}`,
    });
  return res;
}

/* --- 旺衰 / 格局 / 喜用 --- */
const POSW = [0.8, 2.0, 1.3, 1.0],
  STW = [0.9, 1.2, 0, 1.0],
  CANGW = [1, 0.5, 0.3];
const SEASON = ["旺", "相", "死", "囚", "休"]; // 按 (日主五行−月令五行) mod 5:同=旺、月令生我=相、月令克我=死、我克月令=囚、我生月令=休
function seasonState(dm, mb) {
  const M = GAN_WX[CANG[mb][0]],
    D = GAN_WX[dm],
    r = (D - M + 5) % 5;
  return SEASON[r];
}
function strength(bz) {
  const dm = bz.dm,
    dw = GAN_WX[dm],
    P = bz.pill;
  let help = 0,
    drain = 0;
  const wxw = [0, 0, 0, 0, 0],
    cnt = [0, 0, 0, 0, 0];
  let root = 0;
  const add = (g, w, isZhi) => {
    const wx = GAN_WX[g],
      rel = (wx - dw + 5) % 5;
    wxw[wx] += w;
    if (rel === 0 || rel === 4) {
      help += w;
      if (isZhi && rel === 0) root += w;
    } else drain += w;
  };
  P.forEach((p, i) => {
    if (i !== 2) add(p.s, STW[i], false);
    CANG[p.b].forEach((g, k) => add(g, CANGW[k] * POSW[i], true));
  });
  const ratio = help / (help + drain);
  const level =
    ratio < 0.3
      ? "极弱"
      : ratio < 0.42
        ? "偏弱"
        : ratio < 0.55
          ? "中和"
          : ratio < 0.68
            ? "偏强"
            : "极强";
  const st = seasonState(dm, P[1].b);
  const tot = wxw.reduce((a, b) => a + b, 0) + STW[2] * 0;
  return { ratio, level, help, drain, wxw, root, season: st, deLing: st === "旺" || st === "相" };
}
function geju(bz) {
  const dm = bz.dm,
    mb = bz.pill[1].b,
    cg = CANG[mb],
    main = cg[0],
    ss = shishen(dm, main);
  const S = bz.pill.map((p) => p.s);
  const tou = cg.filter((g) => S.includes(g)).map((g) => GAN[g]);
  let name;
  if (dm === main || (GAN_WX[main] === GAN_WX[dm] && ss === "比肩")) name = "建禄格";
  else if (ss === "劫财") name = dm % 2 === 0 ? "阳刃格" : "月劫格";
  else name = ss + "格";
  const guan = cg.map((g) => shishen(dm, g));
  return {
    name,
    main: GAN[main],
    ss,
    tou,
    note: tou.length ? `月令藏干透出:${tou.join("、")}` : "月令藏干未透天干",
  };
}
const WXN = ["木", "火", "土", "金", "水"];
function xiyong(bz, stg) {
  const dw = GAN_WX[bz.dm],
    yin = (dw + 4) % 5,
    bi = dw,
    shi = (dw + 1) % 5,
    cai = (dw + 2) % 5,
    guan = (dw + 3) % 5;
  const mb = bz.pill[1].b;
  let favor = [],
    avoid = [],
    lead = "",
    th = null,
    notes = [];
  const w = stg.wxw;
  if (stg.level === "极弱" || stg.level === "偏弱") {
    lead = w[yin] <= w[bi] ? WXN[yin] : WXN[bi];
    favor = [yin, bi];
    avoid = [shi, cai, guan];
    notes.push(`日主${stg.level},以生扶为要:印(${WXN[yin]})生身、比劫(${WXN[bi]})助身。`);
  } else if (stg.level === "极强" || stg.level === "偏强") {
    const opts = [shi, cai, guan];
    opts.sort((a, b) => w[a] - w[b]);
    lead = WXN[shi];
    favor = [shi, cai, guan];
    avoid = [yin, bi];
    notes.push(
      `日主${stg.level},以泄耗克为要:食伤(${WXN[shi]})泄秀、财(${WXN[cai]})耗身、官杀(${WXN[guan]})制身。`,
    );
  } else {
    const order = [0, 1, 2, 3, 4].sort((a, b) => w[a] - w[b]);
    favor = [order[0], order[1]];
    avoid = [order[4]];
    lead = WXN[order[0]];
    notes.push(
      `日主中和,以平衡五行为主:补力量最薄的${WXN[order[0]]}、${WXN[order[1]]},抑最盛的${WXN[order[4]]}。`,
    );
  }
  if ([11, 0, 1].includes(mb)) {
    th = 1;
    notes.push("生于冬月,气寒,取火调候(暖局)。");
    if (!favor.includes(1)) favor = favor.concat([1]);
  }
  if ([5, 6, 7].includes(mb)) {
    th = 4;
    notes.push("生于夏月,气燥,取水调候(润局)。");
    if (!favor.includes(4)) favor = favor.concat([4]);
  }
  avoid = avoid.filter((x) => !favor.includes(x));
  return { lead, favor: [...new Set(favor)], avoid: [...new Set(avoid)], th, notes };
}

/* --- 胎元 / 命宫 / 身宫 --- */
function mingGongEtc(bz) {
  const P = bz.pill,
    ys = P[0].s,
    mb = P[1].b,
    ms = P[1].s,
    hb = P[3].b;
  const mno = ((mb - 2 + 12) % 12) + 1,
    hno = ((hb - 2 + 12) % 12) + 1,
    s = mno + hno;
  let n = 14 - s;
  if (n <= 0) n += 12;
  let n2 = s + 2;
  while (n2 > 12) n2 -= 12;
  const zhiOf = (k) => (k - 1 + 2) % 12;
  const stemOf = (b) => ((ys % 5) * 2 + 2 + ((b - 2 + 12) % 12)) % 10;
  const mB = zhiOf(n),
    sB = zhiOf(n2);
  const taiS = (ms + 1) % 10,
    taiB = (mb + 3) % 12;
  return {
    ming: { s: stemOf(mB), b: mB },
    shen: { s: stemOf(sB), b: sB },
    tai: { s: taiS, b: taiB },
  };
}

/* --- 综合 --- */
function baziDeep(bz) {
  const st = strength(bz),
    gj = geju(bz),
    xy = xiyong(bz, st),
    rel = relations(bz),
    ss = shensha(bz),
    ex = mingGongEtc(bz);
  const cs = bz.pill.map((p) => changsheng(bz.dm, p.b)),
    zizuo = bz.pill.map((p) => changsheng(p.s, p.b));
  const kong = xunkongOf(bz.dayIdx);
  return { st, gj, xy, rel, ss, ex, cs, zizuo, kong };
}

/* --- 流年 / 流月 / 大运评分 --- */
function scoreGZ(bz, deep, idx, wS, wB) {
  const s = idx % 10,
    b = idx % 12,
    dm = bz.dm,
    xy = deep.xy;
  const fav = (x) => (xy.favor.includes(x) ? 1 : xy.avoid.includes(x) ? -1 : 0);
  let sc = fav(GAN_WX[s]) * wS + fav(GAN_WX[CANG[b][0]]) * wB;
  const notes = [];
  const dB = bz.pill[2].b,
    mB = bz.pill[1].b,
    yB = bz.pill[0].b,
    hB = bz.pill[3].b;
  const isC = (x, y) => Z_CHONG.some(([a, c]) => (a === x && c === y) || (a === y && c === x));
  const isH = (x, y) => Z_HE6.some(([a, c]) => (a === x && c === y) || (a === y && c === x));
  if (isC(b, dB)) {
    sc -= 0.9;
    notes.push("冲日支");
  }
  if (isC(b, mB)) {
    sc -= 0.5;
    notes.push("冲月支");
  }
  if (isC(b, yB)) {
    sc -= 0.35;
    notes.push("冲年支");
  }
  if (isC(b, hB)) {
    sc -= 0.35;
    notes.push("冲时支");
  }
  if (isH(b, dB)) {
    sc += 0.35;
    notes.push("合日支");
  }
  if (idx === bz.dayIdx) {
    sc -= 0.3;
    notes.push("伏吟日柱");
  }
  if (
    G_CHONG.some(([a, c]) => (a === s && c === bz.pill[2].s) || (a === bz.pill[2].s && c === s)) &&
    isC(b, dB)
  ) {
    sc -= 0.5;
    notes.push("天克地冲");
  }
  return { sc, notes };
}
const LV = (sc) =>
  sc >= 0.85 ? "吉" : sc >= 0.3 ? "小吉" : sc > -0.3 ? "平" : sc > -0.85 ? "小凶" : "凶";
function dayunTable(bz, deep) {
  return bz.dayun.map((d) => {
    const r = scoreGZ(bz, deep, d.idx, 0.6, 0.4);
    return {
      ...d,
      gz: gz(d.idx),
      ss: shishen(bz.dm, d.idx % 10),
      sc: r.sc,
      lv: LV(r.sc),
      notes: r.notes,
    };
  });
}
function liunian(bz, deep, y0, n) {
  const out = [];
  for (let y = y0; y < y0 + n; y++) {
    const idx = (((y - 4) % 60) + 60) % 60,
      r = scoreGZ(bz, deep, idx, 0.6, 0.4);
    out.push({
      y,
      idx,
      gz: gz(idx),
      ss: shishen(bz.dm, idx % 10),
      sc: r.sc,
      lv: LV(r.sc),
      notes: r.notes,
    });
  }
  return out;
}
function liuyue(bz, deep, year) {
  const ys = (((year - 4) % 10) + 10) % 10,
    out = [];
  for (let i = 0; i < 12; i++) {
    const b = (2 + i) % 12,
      s = ((ys % 5) * 2 + 2 + i) % 10,
      idx = ganzhiIdx(s, b);
    const jd = termJD((315 + 30 * i) % 360, jdFromGreg(year, 2, 4) + i * 30.4 - 0.3),
      bj = fromJD(jd + 8 / 24);
    const r = scoreGZ(bz, deep, idx, 0.6, 0.4);
    out.push({
      name: JIE[i],
      gz: gz(idx),
      ss: shishen(bz.dm, s),
      from: bj,
      sc: r.sc,
      lv: LV(r.sc),
      notes: r.notes,
    });
  }
  return out;
}

/* --- 合盘(两人八字) --- */
function hepan(A, B, dA, dB, genderA, genderB) {
  const lines = [];
  let score = 50;
  const a = A.pill,
    b = B.pill;
  const add = (d, txt, t) => {
    score += d;
    lines.push({ d, txt, t });
  };
  // 日干
  const gh = G_HE.find(([x, y]) => (A.dm === x && B.dm === y) || (A.dm === y && B.dm === x));
  if (gh) add(10, `日干${GAN[A.dm]}${GAN[B.dm]}相合(化${gh[2]}):心性相吸`, "吉");
  else if (G_CHONG.some(([x, y]) => (A.dm === x && B.dm === y) || (A.dm === y && B.dm === x)))
    add(-6, `日干${GAN[A.dm]}${GAN[B.dm]}相克:观念易冲突`, "凶");
  // 日支
  const dA_ = a[2].b,
    dB_ = b[2].b;
  if (Z_HE6.some(([x, y]) => (dA_ === x && dB_ === y) || (dA_ === y && dB_ === x)))
    add(12, `日支${ZHI[dA_]}${ZHI[dB_]}六合:配偶宫相合`, "吉");
  if (
    Z_SANHE.some((g) => g.slice(0, 3).includes(dA_) && g.slice(0, 3).includes(dB_) && dA_ !== dB_)
  )
    add(7, `日支${ZHI[dA_]}${ZHI[dB_]}同属三合局:气类相投`, "吉");
  if (Z_CHONG.some(([x, y]) => (dA_ === x && dB_ === y) || (dA_ === y && dB_ === x)))
    add(-10, `日支${ZHI[dA_]}${ZHI[dB_]}相冲:配偶宫对冲,动荡感强`, "凶");
  if (Z_HAI.some(([x, y]) => (dA_ === x && dB_ === y) || (dA_ === y && dB_ === x)))
    add(-5, `日支${ZHI[dA_]}${ZHI[dB_]}相害:细节上易生嫌隙`, "凶");
  if (Z_XING2.some(([x, y]) => (dA_ === x && dB_ === y) || (dA_ === y && dB_ === x)))
    add(-4, `日支${ZHI[dA_]}${ZHI[dB_]}相刑`, "凶");
  // 年支(生肖)
  const yA = a[0].b,
    yB = b[0].b;
  if (Z_HE6.some(([x, y]) => (yA === x && yB === y) || (yA === y && yB === x)))
    add(5, `生肖${ZHI[yA]}${ZHI[yB]}六合`, "吉");
  if (Z_SANHE.some((g) => g.slice(0, 3).includes(yA) && g.slice(0, 3).includes(yB) && yA !== yB))
    add(4, `生肖${ZHI[yA]}${ZHI[yB]}三合`, "吉");
  if (Z_CHONG.some(([x, y]) => (yA === x && yB === y) || (yA === y && yB === x)))
    add(-5, `生肖${ZHI[yA]}${ZHI[yB]}相冲`, "凶");
  // 五行互补:A 的喜用在 B 中是否充足,反之
  const supply = (x, dx, y) =>
    dx.xy.favor.reduce((s, w) => s + y.wx[w], 0) /
    Math.max(
      1,
      y.wx.reduce((s, v) => s + v, 0),
    );
  const sAB = supply(A, dA, B),
    sBA = supply(B, dB, A);
  const sc1 = Math.round((sAB - 0.2) * 40),
    sc2 = Math.round((sBA - 0.2) * 40);
  add(
    Math.max(-6, Math.min(8, sc1)),
    `甲方喜用(${dA.xy.favor.map((x) => WXN[x]).join("")})在乙方八字中占 ${(sAB * 100).toFixed(0)}%`,
    sc1 >= 0 ? "吉" : "凶",
  );
  add(
    Math.max(-6, Math.min(8, sc2)),
    `乙方喜用(${dB.xy.favor.map((x) => WXN[x]).join("")})在甲方八字中占 ${(sBA * 100).toFixed(0)}%`,
    sc2 >= 0 ? "吉" : "凶",
  );
  // 十神:A日干看B日干
  lines.push({
    d: 0,
    txt: `以甲方为日主,乙方日干${GAN[B.dm]}为“${shishen(A.dm, B.dm)}”;以乙方为日主,甲方日干${GAN[A.dm]}为“${shishen(B.dm, A.dm)}”`,
    t: "注",
  });
  // 纳音
  const nA = NAYIN[ganzhiIdx(a[0].s, a[0].b) >> 1],
    nB = NAYIN[ganzhiIdx(b[0].s, b[0].b) >> 1];
  lines.push({ d: 0, txt: `年命纳音:${nA} × ${nB}`, t: "注" });
  score = Math.max(5, Math.min(98, score));
  const lv =
    score >= 80
      ? "相当契合"
      : score >= 65
        ? "较为契合"
        : score >= 50
          ? "一般"
          : score >= 38
            ? "需要磨合"
            : "差异显著";
  return { score, lv, lines };
}

/* =====================================================================
   大六壬:天地盘 · 四课 · 九宗门三传 · 十二天将 · 遁干 · 空亡驿马
   口径:月将取最近中气(过中气换将),昼夜贵人取“甲戊庚牛羊”法;三传按九宗门次序取用。
   ===================================================================== */
const LR_JIGONG = [2, 4, 5, 7, 5, 7, 8, 10, 11, 1]; // 干寄宫:甲寅 乙辰 丙巳 丁未 戊巳 己未 庚申 辛戌 壬亥 癸丑
const LR_JIANG = [
  "登明",
  "神后",
  "大吉",
  "功曹",
  "太冲",
  "天罡",
  "太乙",
  "胜光",
  "小吉",
  "传送",
  "从魁",
  "河魁",
]; // 按地支序 亥→? 见 jiangName
const JIANG_OF_ZHI = [
  "神后",
  "大吉",
  "功曹",
  "太冲",
  "天罡",
  "太乙",
  "胜光",
  "小吉",
  "传送",
  "从魁",
  "河魁",
  "登明",
]; // 子…亥
const TJ = [
  "贵人",
  "螣蛇",
  "朱雀",
  "六合",
  "勾陈",
  "青龙",
  "天空",
  "白虎",
  "太常",
  "玄武",
  "太阴",
  "天后",
];
const TJ_TONE = {
  贵人: "吉",
  螣蛇: "凶",
  朱雀: "凶",
  六合: "吉",
  勾陈: "凶",
  青龙: "吉",
  天空: "凶",
  白虎: "凶",
  太常: "吉",
  玄武: "凶",
  太阴: "吉",
  天后: "吉",
};
const TJ_BRIEF = {
  贵人: "尊长贵人",
  螣蛇: "惊疑怪异",
  朱雀: "口舌文书",
  六合: "和合中介",
  勾陈: "牵连迟滞",
  青龙: "财喜进取",
  天空: "虚诈落空",
  白虎: "血光凶猛",
  太常: "酒食衣禄",
  玄武: "盗失暗昧",
  太阴: "阴私谋略",
  天后: "阴柔内眷",
};
const ZKE = (x, y) => (ZHI_WX[y] - ZHI_WX[x] + 5) % 5 === 2; // 地支 x 克 y
const wxKe = (a, b) => (b - a + 5) % 5 === 2; // 五行 a 克 b
const XING = { 2: 5, 5: 8, 8: 2, 1: 10, 10: 7, 7: 1, 0: 3, 3: 0, 4: 4, 6: 6, 9: 9, 11: 11 }; // 刑(寅巳申、丑戌未、子卯、自刑)
const ZIXING = [4, 6, 9, 11];
const MENG = [2, 5, 8, 11],
  ZHONG = [0, 3, 6, 9];
const LR_GANHE = [5, 6, 7, 8, 9, 0, 1, 2, 3, 4]; // 干五合对象
const yyOfZ = (b) => b % 2; // 0阳 1阴
const YIMA_LR = (b) =>
  [2, 8, 11, 5][
    [
      [8, 0, 4],
      [2, 6, 10],
      [5, 9, 1],
      [11, 3, 7],
    ].findIndex((g) => g.includes(b))
  ]; // 申子辰→寅…
function liurenYueJiang(lon) {
  return (((10 - Math.floor(lon / 30)) % 12) + 12) % 12;
} // 春分后戌将 谷雨后酉将 …
function liuren(dayIdx, hb, zj, opt) {
  opt = opt || {};
  const dg = dayIdx % 10,
    dz = dayIdx % 12;
  const sky = [];
  for (let b = 0; b < 12; b++) sky[b] = (((zj + b - hb) % 12) + 12) % 12; // 地盘 b 上的天盘神
  const earthOf = [];
  for (let b = 0; b < 12; b++) earthOf[sky[b]] = b; // 天盘神 X 所临的地盘
  const g0 = LR_JIGONG[dg];
  const s1 = sky[g0],
    s2 = sky[s1],
    s3 = sky[dz],
    s4 = sky[s3];
  const ke4 = [
    { u: s1, l: g0, dgL: true },
    { u: s2, l: s1 },
    { u: s3, l: dz },
    { u: s4, l: s3 },
  ];
  ke4.forEach((k, i) => {
    const lw = i === 0 ? GAN_WX[dg] : ZHI_WX[k.l],
      uw = ZHI_WX[k.u];
    k.rel = wxKe(lw, uw) ? "贼" : wxKe(uw, lw) ? "克" : "和";
    k.lw = lw;
    k.uw = uw;
  });
  const dgYY = dg % 2; // 0阳日 1阴日
  const zei = [],
    ke = [];
  ke4.forEach((k, i) => {
    if (k.rel === "贼" && !zei.some((x) => x.u === k.u)) zei.push({ ...k, i });
    else if (k.rel === "克" && !ke.some((x) => x.u === k.u)) ke.push({ ...k, i });
  });
  // 涉害深度（古法寄宫口径）：候选上神从所临地盘顺行至本位；沿途统计克/被克所涉地支与十干寄宫。
  // 这里不是八字“藏干”。十干寄宫由 LR_JIGONG 反推：巳寄丙戊、未寄丁己等。
  const JIGAN_AT = Array.from({ length: 12 }, () => []);
  LR_JIGONG.forEach((b, g) => JIGAN_AT[b].push(g));
  const depth = (k) => {
    const X = k.u,
      xw = ZHI_WX[X];
    let cnt = 0,
      b = k.l;
    // 上克下：统计“上神所克”；下贼上：统计“克上神”。这是涉害两类候选的方向差异。
    const hit = (w) => (k.rel === "克" ? wxKe(xw, w) : wxKe(w, xw));
    for (let step = 0; step < 12; step++) {
      if (hit(ZHI_WX[b])) cnt++;
      JIGAN_AT[b].forEach((g) => {
        if (hit(GAN_WX[g])) cnt++;
      });
      if (b === X) break;
      b = (b + 1) % 12;
    }
    return cnt;
  };
  const pickShehai = (cands) => {
    const ds = cands.map((c) => depth(c)),
      mx = Math.max(...ds);
    let top = cands.filter((c, i) => ds[i] === mx);
    if (top.length === 1) return { c: top[0], how: "涉害深(取受害最深)", kind: "涉害" };
    // 深浅相等时看“所临地盘”：临寅申巳亥四孟为见机；无孟而临子午卯酉四仲为察微。
    const meng = top.filter((c) => MENG.includes(c.l));
    if (meng.length === 1) return { c: meng[0], how: "见机(深浅相等·取临孟位者)", kind: "见机" };
    if (meng.length > 1) top = meng;
    else {
      const zhong = top.filter((c) => ZHONG.includes(c.l));
      if (zhong.length === 1) return { c: zhong[0], how: "察微(无孟·取临仲位者)", kind: "察微" };
      if (zhong.length > 1) top = zhong;
    }
    // 仍复等时为缀瑕（复等）：阳日干课先见，阴日支课先见。
    const order = dgYY === 0 ? [0, 1, 2, 3] : [2, 3, 0, 1];
    let pick = null;
    for (const i of order) {
      pick = top.find((c) => c.i === i);
      if (pick) break;
    }
    pick = pick || top[0];
    return {
      c: pick,
      how: "缀瑕(复等·" + (dgYY === 0 ? "阳日干课先见" : "阴日支课先见") + ")",
      kind: "缀瑕",
    };
  };
  const chain = (x) => [x, sky[x], sky[sky[x]]];
  const chong = (x) => (x + 6) % 12;
  const fuChain = (x) => {
    // 伏吟三传:初刑中、中刑末;初传自刑则阳日取支上神、阴日取干上神为中;中传自刑则末传取其冲
    let m, n;
    if (ZIXING.includes(x)) {
      m = dgYY === 0 ? dz : g0;
      if (m === x) m = dgYY === 0 ? g0 : dz;
    } else m = XING[x];
    n = ZIXING.includes(m) ? chong(m) : XING[m];
    return [x, m, n];
  };
  let ge = "",
    sub = "",
    chu = null,
    how = "";
  const fuyin = zj === hb,
    fanyin = (((zj - hb) % 12) + 12) % 12 === 6;
  const distinct = new Set(ke4.map((k) => k.u + "," + k.l)).size;
  const guessPool = (cands, label) => {
    if (cands.length === 1) return { c: cands[0], how: label };
    const m = cands.filter((c) => yyOfZ(c.u) === dgYY);
    if (m.length === 1) return { c: m[0], how: "比用(取与日干阴阳同者)" };
    const sh = pickShehai(m.length > 1 ? m : cands);
    return { c: sh.c, how: "涉害(" + sh.how + ")" };
  };
  const yiMa = YIMA_LR(dz);
  if (zei.length || ke.length) {
    const pool = zei.length ? zei : ke,
      label = zei.length ? "重审(下贼上)" : "元首(上克下)";
    const r = guessPool(pool, label);
    ge = zei.length
      ? pool.length === 1
        ? "重审"
        : r.how.startsWith("比用")
          ? "知一"
          : "涉害"
      : pool.length === 1
        ? "元首"
        : r.how.startsWith("比用")
          ? "知一"
          : "涉害";
    sub = r.how;
    chu = chain(r.c.u);
    if (fuyin) {
      ge = "伏吟";
      sub = "有克·" + r.how;
      chu = fuChain(r.c.u);
    } else if (fanyin) {
      sub += "·天地盘返吟";
    }
  } else if (fuyin) {
    ge = "伏吟";
    const x = dgYY === 0 ? g0 : dz;
    sub =
      (dgYY === 0 ? "无克·阳日取干上神" : "无克·阴日取支上神") +
      (ZIXING.includes(x) ? "(初传自刑)" : "");
    chu = fuChain(x);
  } else if (fanyin) {
    ge = "返吟";
    sub = "无克·取驿马";
    chu = [yiMa, s3, s1];
  } else {
    // 遥克
    const yao = [s2, s3, s4].filter((u, i, a) => a.indexOf(u) === i);
    const hao = yao.filter((u) => wxKe(ZHI_WX[u], GAN_WX[dg]));
    const dan = yao.filter((u) => wxKe(GAN_WX[dg], ZHI_WX[u]));

    if (distinct === 2) {
      ge = "八专";
      if (dgYY === 0) {
        sub = "阳日·干上顺数三位";
        chu = [(s1 + 2) % 12, s1, s1];
      } else {
        sub = "阴日·第四课上神逆数三位";
        chu = [(((s4 - 2) % 12) + 12) % 12, s1, s1];
      }
    } else if (hao.length || dan.length) {
      const pool = (hao.length ? hao : dan).map((u) => ({
        u,
        l: earthOf[u],
        i: [s2, s3, s4].indexOf(u) + 1,
        rel: hao.length ? "克" : "贼",
      }));
      const isHao = hao.length > 0,
        label = isHao ? "蒿矢(上克日干)" : "弹射(日干克上)";
      let r;
      if (pool.length === 1) r = { c: pool[0], how: label };
      else {
        const m = pool.filter((c) => yyOfZ(c.u) === dgYY);
        if (m.length === 1) r = { c: m[0], how: label + "·比用" };
        else {
          const sh = pickShehai(m.length > 1 ? m : pool);
          r = { c: sh.c, how: label + "·涉害(" + sh.how + ")" };
        }
      }
      ge = "遥克";
      sub = r.how;
      chu = chain(r.c.u);
    } else if (distinct === 4) {
      ge = "昴星";
      if (dgYY === 0) {
        sub = "阳日·虎视(取酉上神)";
        chu = [sky[9], s3, s1];
      } else {
        sub = "阴日·冬蛇掩目(取酉下神)";
        chu = [earthOf[9], s1, s3];
      }
    } else if (distinct === 3) {
      ge = "别责";
      if (dgYY === 0) {
        const j2 = LR_JIGONG[LR_GANHE[dg]];
        sub = "阳日·取干合之上神";
        chu = [sky[j2], s1, s1];
      } else {
        const grp = [
            [8, 0, 4],
            [2, 6, 10],
            [5, 9, 1],
            [11, 3, 7],
          ].find((g) => g.includes(dz)),
          nx = grp[(grp.indexOf(dz) + 1) % 3];
        sub = "阴日·取支三合前位之上神";
        chu = [sky[nx], s1, s1];
      }
    } else {
      ge = "八专";
      if (dgYY === 0) {
        sub = "阳日·干上顺数三位";
        chu = [(s1 + 2) % 12, s1, s1];
      } else {
        sub = "阴日·第四课上神逆数三位";
        chu = [(((s4 - 2) % 12) + 12) % 12, s1, s1];
      }
    }
  }
  // 天将:昼夜贵人
  const day = hb >= 3 && hb <= 8; // 卯~申为昼
  const GUI = [
    [1, 7],
    [0, 8],
    [11, 9],
    [11, 9],
    [1, 7],
    [0, 8],
    [1, 7],
    [6, 2],
    [5, 3],
    [5, 3],
  ]; // [昼,夜]
  const gui = GUI[dg][day ? 0 : 1];
  const guiEarth = earthOf[gui];
  const shun = [11, 0, 1, 2, 3, 4].includes(guiEarth); // 贵人临亥子丑寅卯辰 顺布,巳午未申酉戌 逆布
  const genOfSky = [];
  for (let x = 0; x < 12; x++) {
    const d = shun ? (x - gui + 12) % 12 : (gui - x + 12) % 12;
    genOfSky[x] = TJ[d];
  }
  // 遁干:以日旬统十二支
  const xunHead = (dayIdx - (dayIdx % 10) + 120) % 60;
  const dun = {};
  for (let i = 0; i < 10; i++) {
    dun[(xunHead + i) % 12] = GAN[i];
  }
  const kong = [((xunHead % 12) + 10) % 12, ((xunHead % 12) + 11) % 12];
  const relOf = (b) => {
    const r = (ZHI_WX[b] - GAN_WX[dg] + 5) % 5;
    return ["兄弟", "子孙", "妻财", "官鬼", "父母"][r];
  };
  const mk = (x) => ({
    z: x,
    gen: genOfSky[x],
    rel: relOf(x),
    dun: dun[x] || "",
    kong: kong.includes(x),
    from: earthOf[x],
  });
  return {
    dg,
    dz,
    hb,
    zj,
    sky,
    earthOf,
    gen: genOfSky,
    day,
    gui,
    shun,
    ke: ke4.map((k) => ({ u: k.u, l: k.l, lIsGan: !!k.dgL, rel: k.rel, gen: genOfSky[k.u] })),
    ge,
    sub,
    chu: chu.map(mk),
    fuyin,
    fanyin,
    distinct,
    kong,
    yiMa,
    xunHead,
    jiangName: JIANG_OF_ZHI[zj],
    dun,
    relOf,
  };
}

/* =====================================================================
   六爻纳甲:京房八宫 · 世应 · 纳甲装卦 · 六亲 · 六神 · 伏神 · 动爻变卦 · 月建日辰旺衰
   说明:纳甲、八宫为《京房易传》通行体系;六神按日干起;旺衰取“月建/日辰”简化判断。
   ===================================================================== */
// 八卦纳甲(内卦,外卦):地支序列自下而上(初→三,四→上)
// 乾 甲子寅辰 / 壬午申戌;坤 乙未巳卯 / 癸丑亥酉;震 庚子寅辰 / 庚午申戌;巽 辛丑亥酉 / 辛未巳卯
// 坎 戊寅辰午 / 戊申戌子;离 己卯丑亥 / 己酉未巳;艮 丙辰午申 / 丙戌子寅;兑 丁巳卯丑 / 丁亥酉未
// 以“先天八卦数”(1乾 2兑 3离 4震 5巽 6坎 7艮 8坤)与本程序 TRI 编号保持一致
const NAJIA = {
  1: { name: "乾", wx: 3, g: [0, 8], lo: [0, 2, 4], up: [6, 8, 10] },
  2: { name: "兑", wx: 3, g: [3, 3], lo: [5, 3, 1], up: [11, 9, 7] },
  3: { name: "离", wx: 1, g: [5, 5], lo: [3, 1, 11], up: [9, 7, 5] },
  4: { name: "震", wx: 0, g: [6, 6], lo: [0, 2, 4], up: [6, 8, 10] },
  5: { name: "巽", wx: 0, g: [7, 7], lo: [1, 11, 9], up: [7, 5, 3] },
  6: { name: "坎", wx: 4, g: [4, 4], lo: [2, 4, 6], up: [8, 10, 0] },
  7: { name: "艮", wx: 2, g: [2, 2], lo: [4, 6, 8], up: [10, 0, 2] },
  8: { name: "坤", wx: 2, g: [1, 9], lo: [7, 5, 3], up: [1, 11, 9] },
};
// 内卦干:乾甲 坤乙 震庚 巽辛 坎戊 离己 艮丙 兑丁;外卦干:乾壬 坤癸 震庚 巽辛 坎戊 离己 艮丙 兑丁 (g=[内,外])
const NJ_GAN = {
  1: [0, 8],
  2: [3, 3],
  3: [5, 5],
  4: [6, 6],
  5: [7, 7],
  6: [4, 4],
  7: [2, 2],
  8: [1, 9],
};
const LY_LIU = ["兄弟", "子孙", "妻财", "官鬼", "父母"];
const LIUSHEN = ["青龙", "朱雀", "勾陈", "螣蛇", "白虎", "玄武"];
const LS_START = [0, 0, 1, 1, 2, 3, 4, 4, 5, 5]; // 甲乙青龙 丙丁朱雀 戊勾陈 己螣蛇 庚辛白虎 壬癸玄武

// 京房八宫:每宫八卦(上下卦编号 [上,下]),按 本宫、一世…五世、游魂、归魂 顺序
// 以三爻 lines(初→上)判定较稳:通过“变爻规则”从纯卦推出
function palaceTable() {
  const T = {};
  for (let pal = 1; pal <= 8; pal++) {
    // 纯卦:上下皆 pal
    const base = TRI[pal].l.concat(TRI[pal].l);
    let cur = base.slice();
    const seq = [];
    seq.push({ lines: cur.slice(), shi: 6, order: "本宫" });
    for (let k = 1; k <= 5; k++) {
      cur[k - 1] ^= 1;
      seq.push({
        lines: cur.slice(),
        shi: k,
        order: ["", "一世", "二世", "三世", "四世", "五世"][k],
      });
    }
    // 游魂:五世卦四爻变回
    cur[3] ^= 1;
    seq.push({ lines: cur.slice(), shi: 4, order: "游魂" });
    // 归魂:游魂卦下卦三爻全变(初二三爻变)
    const g = cur.slice();
    g[0] ^= 1;
    g[1] ^= 1;
    g[2] ^= 1;
    seq.push({ lines: g, shi: 3, order: "归魂" });
    seq.forEach((e) => {
      T[e.lines.join("")] = { pal, shi: e.shi, order: e.order };
    });
  }
  return T;
}
const LY_PAL = palaceTable();

function liuyao(lines, moving, dayIdx, monthB, now) {
  // lines:自下而上 6 个 0/1(阳=1);moving:动爻下标数组(0..5)
  const info = hexInfo(lines),
    key = lines.join("");
  const pal = LY_PAL[key];
  const shi = pal.shi,
    ying = ((shi + 2) % 6) + 1; // 世应相隔两位:世1应4 世2应5 世3应6 世4应1 世5应2 世6应3
  const pw = NAJIA[pal.pal].wx;
  const lo = trigOf(lines.slice(0, 3)),
    up = trigOf(lines.slice(3, 6));
  const rows = [];
  for (let i = 0; i < 6; i++) {
    const lower = i < 3,
      n = NAJIA[lower ? lo : up],
      b = (lower ? n.lo : n.up)[i % 3],
      gG = NJ_GAN[lower ? lo : up][lower ? 0 : 1];
    const wx = ZHI_WX[b],
      rel = LY_LIU[(wx - pw + 5) % 5];
    rows.push({
      i,
      yang: lines[i] === 1,
      b,
      gan: gG,
      wx,
      rel,
      moving: moving.includes(i),
      isShi: i + 1 === shi,
      isYing: i + 1 === ying,
    });
  }
  // 六神(自初爻起,按日干)
  const st = LS_START[dayIdx % 10];
  rows.forEach((r, i) => {
    r.ls = LIUSHEN[(st + i) % 6];
  });
  // 伏神:本宫纯卦六亲若在本卦六爻不现,则伏于所属爻下
  const pure = NAJIA[pal.pal],
    pureLines = TRI[pal.pal].l.concat(TRI[pal.pal].l);
  const pureRows = [];
  for (let i = 0; i < 6; i++) {
    const lower = i < 3,
      b = (lower ? pure.lo : pure.up)[i % 3],
      gG = NJ_GAN[pal.pal][lower ? 0 : 1],
      wx = ZHI_WX[b];
    const d = (wx - pw + 5) % 5;
    pureRows.push({
      b,
      gan: gG,
      rel: LY_LIU[d === 0 ? 0 : d === 1 ? 1 : d === 2 ? 2 : d === 3 ? 3 : 4],
    });
  }
  const present = new Set(rows.map((r) => r.rel));
  const fu = [];
  LY_LIU.forEach((rel) => {
    if (!present.has(rel)) {
      const k = pureRows.findIndex((x) => x.rel === rel);
      if (k >= 0) {
        rows[k].fu = { rel, b: pureRows[k].b, gan: pureRows[k].gan };
        fu.push(rel);
      }
    }
  });
  // 变卦
  const ln2 = lines.map((v, i) => (moving.includes(i) ? v ^ 1 : v)),
    info2 = hexInfo(ln2),
    pal2 = LY_PAL[ln2.join("")];
  const lo2 = trigOf(ln2.slice(0, 3)),
    up2 = trigOf(ln2.slice(3, 6));
  const rows2 = [];
  for (let i = 0; i < 6; i++) {
    const lower = i < 3,
      n = NAJIA[lower ? lo2 : up2],
      b = (lower ? n.lo : n.up)[i % 3],
      gG = NJ_GAN[lower ? lo2 : up2][lower ? 0 : 1],
      wx = ZHI_WX[b],
      d = (wx - pw + 5) % 5;
    rows2.push({ i, yang: ln2[i] === 1, b, gan: gG, wx, rel: LY_LIU[d], from: moving.includes(i) });
  }
  // 动爻生克:变爻与动爻的关系(回头生/回头克/化进/化退…)
  moving.forEach((i) => {
    const a = rows[i],
      c = rows2[i];
    let t = "";
    const gb = (x, y) => (ZHI_WX[y] - ZHI_WX[x] + 5) % 5; // 0同 1生 2克 3被克 4被生
    const r = gb(a.b, c.b);
    if (r === 4) t = "回头生";
    else if (r === 3) t = "回头克";
    else if (r === 1) t = "化泄";
    else if (r === 2) t = "化克(我克变爻)";
    else t = "化比和";
    if (a.b === c.b) t = "伏吟(动而不变)";
    else if (ZHI_WX[a.b] === ZHI_WX[c.b]) {
      const ord = [
        [2, 3, 4],
        [5, 6, 7],
        [8, 9, 10],
        [11, 0, 1],
      ]; // 同五行:进退
      const prog = (c.b - a.b + 12) % 12;
      if (prog === 1 || prog === 2) t = "化进神";
      else if (prog === 11 || prog === 10) t = "化退神";
    }
    if (
      [
        [0, 6],
        [1, 7],
        [2, 8],
        [3, 9],
        [4, 10],
        [5, 11],
      ].some(([x, y]) => (a.b === x && c.b === y) || (a.b === y && c.b === x))
    )
      t = "化冲(反吟)";
    if (
      [
        [0, 1],
        [2, 11],
        [3, 10],
        [4, 9],
        [5, 8],
        [6, 7],
      ].some(([x, y]) => (a.b === x && c.b === y) || (a.b === y && c.b === x))
    )
      t = "化合";
    a.change = t;
  });
  // 月建 日辰:旺衰(简化)——月建同五行/生扶为旺相,月破为衰
  const dayB = dayIdx % 12;
  rows.forEach((r) => {
    const m = (monthB - r.b + 12) % 12 === 6,
      d = (dayB - r.b + 12) % 12 === 6;
    const mw = ZHI_WX[monthB],
      rw = ZHI_WX[r.b],
      mr = (rw - mw + 5) % 5; // 与月建五行的关系
    const st =
      r.b === monthB
        ? "月建"
        : m
          ? "月破"
          : mr === 0
            ? "旺(同月建之气)"
            : mr === 1
              ? "相(得月建所生)"
              : mr === 4
                ? "休(生月建)"
                : mr === 3
                  ? "囚(克月建)"
                  : "死(受月建克)";
    r.season = st;
    r.dayRel =
      r.b === dayB
        ? "日辰临爻"
        : d
          ? "日冲(暗动或日破)"
          : (ZHI_WX[dayB] - r.wx + 5) % 5 === 1
            ? "日生"
            : (ZHI_WX[dayB] - r.wx + 5) % 5 === 2
              ? "日克"
              : "";
    r.kong = xunkongOf(dayIdx).includes(r.b);
  });
  return {
    info,
    info2,
    pal: pal,
    pal2,
    shi,
    ying,
    rows,
    rows2,
    fu,
    palName: NAJIA[pal.pal].name + "宫",
    palWx: pw,
    lo,
    up,
    moving,
    dayIdx,
    monthB,
    kong: xunkongOf(dayIdx),
  };
}

/* =====================================================================
   玄空飞星(三元九运 · 二十四山 · 山向飞星 · 流年流月紫白)
   口径:挨星(不含替卦兼向);元运以立春为界;山星/向星顺逆按“入中星在其所属宫位、与坐/向山同元龙者之阴阳”取。
   ===================================================================== */
// 洛书飞行序:中→乾→兑→艮→离→坎→坤→震→巽 (宫号 5,6,7,8,9,1,2,3,4)
const XK_ORDER = [5, 6, 7, 8, 9, 1, 2, 3, 4];
const XK_PAL_NAME = {
  1: "坎",
  2: "坤",
  3: "震",
  4: "巽",
  5: "中",
  6: "乾",
  7: "兑",
  8: "艮",
  9: "离",
};
const XK_PAL_DIR = {
  1: "北",
  2: "西南",
  3: "东",
  4: "东南",
  5: "中",
  6: "西北",
  7: "西",
  8: "东北",
  9: "南",
};
// 二十四山:按宫分三山 [地元,天元,人元]
const XK_MTN = {
  1: ["壬", "子", "癸"],
  2: ["未", "坤", "申"],
  3: ["甲", "卯", "乙"],
  4: ["辰", "巽", "巳"],
  6: ["戌", "乾", "亥"],
  7: ["庚", "酉", "辛"],
  8: ["丑", "艮", "寅"],
  9: ["丙", "午", "丁"],
};
function xkYY(pal, pos) {
  // 1=阳(顺飞) 0=阴(逆飞);pos: 0地元 1天元 2人元
  // 玄空阴阳(经对拍公开的八运/九运山向表反推校验):
  //  阳:乾坤艮巽(天元) 寅申巳亥(人元) 甲庚壬丙(地元);阴:子午卯酉(天元) 乙辛丁癸(人元) 辰戌丑未(地元)
  return [1, 3, 7, 9].includes(pal) ? (pos === 0 ? 1 : 0) : pos === 0 ? 0 : 1;
}
function xkFind(mtn) {
  for (const p in XK_MTN) {
    const k = XK_MTN[p].indexOf(mtn);
    if (k >= 0) return { pal: +p, pos: k };
  }
  return null;
}
function xkFly(center, forward) {
  // 返回 {宫:星}
  const out = {};
  for (let i = 0; i < 9; i++) {
    const pal = XK_ORDER[i];
    const n = forward ? ((center - 1 + i) % 9) + 1 : ((((center - 1 - i) % 9) + 9) % 9) + 1;
    out[pal] = n;
  }
  return out;
}
function xkYuan(year) {
  // 三元九运 (立春为界,调用方传入已按立春校正的“命年”)
  const k = Math.floor((year - 1864) / 20); // 1864 起一运
  return (((k % 9) + 9) % 9) + 1;
}
function xkYuanBand(n) {
  const y0 = 1864 + (n - 1) * 20;
  const y = y0 + Math.floor((2026 - y0) / 180) * 180;
  return [y, y + 19];
}
/* 山向飞星盘:zuo=坐山名,yun=元运(1-9) */
function xuankong(zuo, yun) {
  const z = xkFind(zuo);
  if (!z) return null;
  const xiangPal = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  // 向:与坐山对宫、同元龙位置
  const opp = { 1: 9, 9: 1, 3: 7, 7: 3, 2: 8, 8: 2, 4: 6, 6: 4 };
  const xp = opp[z.pal],
    xm = XK_MTN[xp][z.pos];
  const yunPan = xkFly(yun, true); // 运盘(顺飞)
  const zStar = yunPan[z.pal],
    xStar = yunPan[xp]; // 坐宫、向宫的运盘星
  const dirOf = (star, pos, own) => {
    // 入中后顺逆
    if (star === 5) return own; // 5 入中:取坐/向山自身阴阳
    const pal = star; // 星号与宫号一致(洛书)
    if (!XK_MTN[pal]) return own;
    return xkYY(pal, pos);
  };
  const zDir = dirOf(zStar, z.pos, xkYY(z.pal, z.pos)),
    xDir = dirOf(xStar, z.pos, xkYY(xp, z.pos));
  const shan = xkFly(zStar, zDir === 1),
    xiang = xkFly(xStar, xDir === 1); // 山星取坐宫星入中;向星取向宫星入中
  const cells = {};
  for (let p = 1; p <= 9; p++) {
    cells[p] = { pal: p, yun: yunPan[p], shan: shan[p], xiang: xiang[p] };
  }
  // 格局判断
  const notes = [];
  const wangShan = cells[z.pal].shan === yun,
    wangXiang = cells[xp].xiang === yun;
  const shangShan = cells[xp].shan === yun,
    xiaShui = cells[z.pal].xiang === yun; // 山星到向、向星到坐
  if (wangShan && wangXiang)
    notes.push({ t: "吉", n: "旺山旺向", d: "当运山星到坐山、当运向星到向首" });
  else if (shangShan && xiaShui)
    notes.push({ t: "凶", n: "上山下水", d: "山星飞到向首、向星飞到坐山,旺星错置" });
  else if (wangXiang && shangShan)
    notes.push({ t: "平", n: "双星会向", d: "山星向星同到向首,宜水不宜山(取宜于向首见水)" });
  else if (wangShan && xiaShui)
    notes.push({ t: "平", n: "双星会坐", d: "山星向星同到坐山,宜山不宜水" });
  else {
    if (wangShan) notes.push({ t: "吉", n: "旺山", d: "当运山星到坐宫" });
    if (wangXiang) notes.push({ t: "吉", n: "旺向", d: "当运向星到向宫" });
    if (shangShan) notes.push({ t: "凶", n: "山星到向", d: "当运山星飞到向首" });
    if (xiaShui) notes.push({ t: "凶", n: "向星到坐", d: "当运向星飞到坐山" });
  }
  // 合十
  const heshi = [];
  for (let p = 1; p <= 9; p++) {
    if (p !== 5 && cells[p].shan + cells[p].xiang === 10) heshi.push(p);
  }
  if (heshi.length === 0 && cells[5].shan + cells[5].xiang === 10) heshi.push(5);
  if (heshi.length >= 1)
    notes.push({
      t: "吉",
      n: "合十",
      d: "山向星和为十:" + heshi.map((p) => XK_PAL_NAME[p]).join("、") + "宫",
    });
  // 五黄二黑
  const hot = [];
  for (let p = 1; p <= 9; p++) {
    if (cells[p].shan === 5 || cells[p].xiang === 5) hot.push({ p, t: "五黄" });
  }
  return {
    zuo,
    xiang: xm,
    zPal: z.pal,
    xPal: xp,
    pos: z.pos,
    yun,
    cells,
    zDir,
    xDir,
    notes,
    yunPan,
  };
}
/* 流年紫白:立春为界 */
function xkYearStar(y) {
  return ((((2024 - y + 2) % 9) + 9) % 9) + 1;
} // 2024→3 2025→2 2026→1 2027→9
function xkMonthStar(yearZhi, monthIdx) {
  // monthIdx 0=寅月…11=丑月
  const start = { 0: 8, 3: 8, 6: 8, 9: 8, 1: 5, 4: 5, 7: 5, 10: 5, 2: 2, 5: 2, 8: 2, 11: 2 }[
    yearZhi
  ]; // 子午卯酉年寅月8;辰戌丑未年5;寅申巳亥年2
  return ((((start - 1 - monthIdx) % 9) + 9) % 9) + 1;
}
const XK_STAR_INFO = {
  1: { n: "一白贪狼", t: "吉", wx: 4, d: "桃花文昌,主人缘官运" },
  2: { n: "二黑巨门", t: "凶", wx: 2, d: "病符,主疾病" },
  3: { n: "三碧禄存", t: "凶", wx: 0, d: "是非口舌,官非" },
  4: { n: "四绿文曲", t: "吉", wx: 0, d: "文昌,利学业姻缘" },
  5: { n: "五黄廉贞", t: "大凶", wx: 2, d: "灾煞,宜静不宜动" },
  6: { n: "六白武曲", t: "吉", wx: 3, d: "偏财权威,利事业" },
  7: { n: "七赤破军", t: "平", wx: 3, d: "退运凶、当令吉;主口舌盗耗" },
  8: { n: "八白左辅", t: "吉", wx: 2, d: "财星,得令大旺(八运)" },
  9: { n: "九紫右弼", t: "吉", wx: 1, d: "喜庆,九运当令" },
};
/* 判定某运星当令/生气/退气/死气 */
function xkQi(star, yun) {
  if (star === yun) return "当旺";
  const next = (yun % 9) + 1,
    next2 = (next % 9) + 1; // 生气:即将当运者
  if (star === next || star === next2) return "生气";
  const prev = ((yun - 2 + 9) % 9) + 1;
  if (star === prev) return "退气";
  return "衰死";
}

/* =====================================================================
   择日:建除十二值星 · 二十八宿 · 黄道黑道十二天神 · 冲煞 · 吉神凶煞 · 每日宜忌 · 按事项选日
   宜忌与吉神凶煞数据来自《协纪辨方书》系传统历书体系(由 6tail/lunar-javascript(MIT)数据抽取并按“月支×日干支”压缩)。
   ===================================================================== */
const JCHU = ["建", "除", "满", "平", "定", "执", "破", "危", "成", "收", "开", "闭"];
const JCHU_TONE = {
  建: "平",
  除: "吉",
  满: "吉",
  平: "平",
  定: "吉",
  执: "平",
  破: "凶",
  危: "平",
  成: "吉",
  收: "平",
  开: "吉",
  闭: "凶",
};
const XIU28 = [
  "角木蛟",
  "亢金龙",
  "氐土貉",
  "房日兔",
  "心月狐",
  "尾火虎",
  "箕水豹",
  "斗木獬",
  "牛金牛",
  "女土蝠",
  "虚日鼠",
  "危月燕",
  "室火猪",
  "壁水貐",
  "奎木狼",
  "娄金狗",
  "胃土雉",
  "昴日鸡",
  "毕月乌",
  "觜火猴",
  "参水猿",
  "井木犴",
  "鬼金羊",
  "柳土獐",
  "星日马",
  "张月鹿",
  "翼火蛇",
  "轸水蚓",
];
const XIU_TONE = [
  1, -1, -1, 1, -1, 1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, 1, -1, 1, -1, 1, 1, -1, -1, -1, 1, -1, 1,
]; // 二十八宿吉凶(通行歌诀,与历书一致)
const TIANSHEN = [
  "青龙",
  "明堂",
  "天刑",
  "朱雀",
  "金匮",
  "天德",
  "白虎",
  "玉堂",
  "天牢",
  "玄武",
  "司命",
  "勾陈",
];
const TS_HUANG = ["青龙", "明堂", "金匮", "天德", "玉堂", "司命"];
const ZODIAC = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];
const XIU_ANCHOR = 11; // (JDN + anchor) mod 28
const ZERI_DATA = {
  items:
    "塑绘 斋醮 出行 拆卸 解除 修造 移徙 造船 入殓 除服 成服 移柩 启钻 修坟 立碑 谢土 无 月空 母仓 三合 天喜 天医 玉宇 除神 青龙 鸣吠 九坎 九焦 土符 大煞 五离 祭祀 沐浴 安床 纳财 畋猎 捕捉 开市 破土 月德合 金堂 明堂 河魁 大时 大败 咸池 订盟 纳采 祈福 动土 上梁 嫁娶 作灶 时阳 生气 五虚 九空 往亡 天刑 理发 补垣 塞穴 入宅 安葬 王日 游祸 血支 重日 朱雀 教牛马 馀事勿取 官日 敬安 金匮 鸣吠对 月建 小时 月厌 地火 造畜稠 会亲友 行丧 月恩 守日 不将 要安 土府 开光 出火 进人口 栽种 纳畜 探病 时德 相日 吉期 五合 劫煞 天贼 起基 交易 立券 挂匾 词讼 作梁 开池 安门 掘井 民日 天巫 福德 天仓 宝光 灾煞 天火 平治道涂 开仓 出货财 四相 天马 致死 月煞 月虚 白虎 安机械 盖屋 定磉 安香 置产 天德合 时阴 六仪 玉堂 厌对 招摇 死气 整手足甲 解神 月害 小耗 四废 天牢 破屋 坏垣 普护 月破 大耗 四击 八专 元武 阳破阴冲 牧养 阳德 五富 福生 司命 断蚁 造庙 天恩 临日 复日 勾陈 问名 冠笄 裁衣 天德 月德 圣心 天罡 月刑 竖柱 开柱眼 伐木 架马 阴德 驿马 天后 益后 六合 续世 天吏 四忌 六蛇 归忌 血忌 逐阵 触水龙 阳错 求医 治病 入学 扫舍 开生坟 合寿木 八风 求嗣 习艺 经络 地囊 结网 死神 安碓磑 放水 造仓 四耗 四穷 大会 阴错 合帐 天赦 天愿 诸事不宜 修饰垣墙 五墓 取渔 八龙 合脊 酬神 针灸 造车器 阴道冲阳 造桥 纳婿 赴任 孤辰 阴位 雕刻 行狠 了戾 开渠 开厕 岁薄 阴阳交破 绝阴 小会 纯阳 归岫 七鸟 割蜜 阳错阴冲 普渡 筑堤 天狗 分居 九虎 成日 孤阳 阴神 三丧 鬼哭 大退 四离 阴阳俱错 阴阳击冲 三阴 雇佣 乘船 天符 归宁 修门 七符 绝阳 纯阴 单阴",
  yi: "乤乙丟丠两丈三上丿丏丌不,丳丯丮仛丟丰亝乿乘丂伂亾举乤乥亼亽丅丱亪串乽乣乪,丯丮严乤乥丂乐乼亪串乳京七乽乣両乪丄丿丌三上不与下丈,丟乳三上丿乆,丯丮丟丰乗乿乘丂乐乼丅丱亪串乽乣乾両乪七丆仝万丿並丈,丳亣丟丰仃丁乙乐京乨享両乫两丣,于亏亽乆,両亭丟一乗丂主京乨享仦丣並丈三上下丌不与,丳丟丰仃乗丂丄举丆乛丈並不与,丟丠主丢乙乚亿两丣仇,丯丮丟丰仃一丄七丅丱亪串乪亀乩乫乛両乚乏並下与,举丆丂乙丅丱乣串乪介丼丽乏,乏久,丮丯仛丟丰丂乿丅丱串严乤乥丆举乐乼乚乛乽乣両乏,丮丯乐乼乗丅丱亪串乽乣仝乚乛乏下丈丌不与丿,丟乳不三上乆,丳亣丟丰仃仢乗乿丂亾丅丱亪串乽乣乪乘丆举乫乏丿並三上,丳丮丯丟丰仃丁乿乘丅乣乽付乪仉丱串丆举,丟丠于亏乆,亣丢乫乩乘両乤乥丣仇主今,丯丮丆举丂乼乐丟丰丁乗乿乘丄亼仚亽乽乣丅乪万乛亗下丈丌丏不与,丟丠临丢两丣両亿,丰丁丯丮丄亭享丅丱乣串们乽付乫三上並乚,丯丮丟丠亣仐交丅丱七丆举乪乴仱仦乚乛丼丽,仐交久乆,丯丮丳丟丰乿乘丂乐仅亼亽丄七乣丅丱乾亿乚亗乏,丢严乤乥乐乙仅丟丰乿乘亼亽丅丱七亿両乚亗什仁丈丿丌,丟丈下乆,一乗丮丯交亣七丅両举乘丿丏仟,丟一乗交亣丳丯七丅丱亪串両丆举乿仇两丣京乙今,丟亼于亏乆,丟丰丁丂亣乼丆举乿両三上下丌,一丁丂七丄丅丆万丈三上下丌不与丏,丟丠両丢丣两,丮丯丟丰丅丱串並,丂丠主丼丽,久乆,丳丂亼亽丟丰串乛,严乥乗丄乼串丌丿,乳乆,仃丁一丮丯乘七丅丱仝乼乚乛亗丈三上下並丿,丳丮丯丟丰丅丱丆举,亽于亏乆,丟丰仃丁乗亾丮亣京丅丱乣今乤乩,丄亏乆,丠主亿,丟乗丰丄乨丱両乫乚乛並下,乨丅丱乪临丽乩仦仱丼乚,丿丌下丈三上,丳丟丰仃丂乘七严乤乥书举丆両乚,主乗丄七丅丿严乤乥书両乚,丟仔乆,举両乗丟乘七丱书丈並丿乛,丟丄乆,于亏丟丠乆,両丟丰仃亣京亭丱乩仦仇丈三上,丄亿乆,丟乗主予両临亿久,丟丰仃乗七丅丱串両亀乚並,丠亣丼丽交丅乨享仉仱仦亜,丟丠丰丁丮丯交七乣亪串両丈三上下丌书仃丂仐乏,丟丄乆,丠丄丮丯交亣七丅丱丆举三上下並丌丿亿不京丢乤乥,丂丳丮丯丈両丌丿丟交乐乙,仔乳丈下乆,乐丯乙丅丱亪串丟乗一丰丁丳両丆举乿乛,丟乐丂丮丯丠丅丱丰丁丳七両丈下丿丏仟交亪串京两乚並乪,丄于亏乆,一乗丂丮丯三上丳仞丈下丌丿与,丈三上下丌丿与乆,丟丰丁一乗三上丈临丳两丣丢,丟丂丠交丰丁丮丯丳乼严乥仉乛,丟丰丁丠両乼仛丈下丌丿与仐仅乤,丄亿丟久乆,严乤乥书乗丄京乨乘举丆両七丱串乚乛丿,严乤乥丢乩丼丳丯乛他両,丟丄仔乳乆,丳丟丰仃丱乐乣介乛亗仦乙,丳丟丰仃乗举丆両丅丱乙,于亏乆,丳严乤乥乗丂乘七丅举丆丱並下丿丌三上,丟丈並三上丌丿不与乆,丟丄乆,严乤乥丢乛乏举丆両乗丰仃丱,両交乤乥丈下丿三上,丟丄乏久仚乆,丠一乗丯丮严乤乥丢乣丱乾今丿並丌不与下,丳丂主両丌丿不严乤乥丢乩亗,丄乳乆,丳丟乗京乘七举丆丅丱串両乛,丳丯丮举丆両丟丰乗丂丄乘七丱乛丏丿並,丟于亏丄乆,丳丯丮乗乿乘丢严乤乥交乽乣丅丱乪丆举乚亗丣乫乩丿並丈三上与,丟丁丈並丌丿不与三上,丟丁丢两丣,丯丮丟丰仃丁丠乙乐亾亽仉乫乩乛亗乏,丟丰仃丠亢乤丢丈下丿不与丏乏久,丟久乏乐丄乆,丳乗丄乘七丅乙举丆両乚丈不丱三上,丂乣両丢乤乥丳乚丈下丿,乳乆,丳丮丯乐丟乼丆举乽両乣乾乿乘书七亀,丠两丣主予丈三上並丿丏与不丌,丟于亏乆,丠乴乵严乤乥丢乚乛亗丣丈並丿,丟丠丼丽亜丄乆,丳丯丮亢丟亣交乐乙丢两临,丮丯乐丟丁丠一乘乗亪串严乤乥乨享京亭乪両七亗乏乫,乤乥丢両交乏丿丏丌三上不与下丈,丟丄久乐乆,丯丮丆丢严乤乥举乐丄亼亽亾両乪乿乘七亿书什仁並不丌丈,丳丮丯丟丰仃乐丄丂亾丢严乤乥仄仅両乴乵乛丿丌不丈,丟亣丳乐乙交仇乳,丟仉仇乆,丳丟丠交丂主丆两丣今举三上丌丿下丈,于亏乆,丯丮丟仃乘一交乐亾七亿介书乫乩仇乚乛並不与丿丈,丈三上下丌丿不与,丟临丈三乆,一乗丠亣乐临今乏,丳丟乗丰仃丂严乤乥丱丢乫乐,丟丰仃乛丈丌丏三上,乗丄京亪串乤乥乛丈下丿,丟丰仃乗丳丂丄京七乙両丱乣串乚乛並丏丌丿,乐亣両乼丟丰仃仅,临丄乳乆,丳丟亣仔亀,丯丳丟丰丂丅丱丆举丿並,丟丠丄主亿于亏乆,丯丮丟丰乿乘丅丂严丆举丱丿並,丽仇他丣,丯丟丰丂乐丅丱丆举,丯丳丟丰丂严乐丱並丌,丟丰仃丁丈三上下丿丌,丯乐亪串乥丈下丿丌,丟丰丁丂严乥丱丆举並丿,乐仃主亣仇两乗,丟乳乆,丰仃丁丯丳京丅丱丆举亝乼严丈三上下丿並丏,亾仄丂丯丮丳乐乙亗两丈下丿丌,丟丠亼亽亿于亏丄乆,丟亣丳七丅丱乣串乽举严乩丽丈三上下丿並,丟仇丈三上下丿並,一乗丰仃丮丯交亣七丅丱乣乪両丆介仇乛,丟丠乗一丰仃丮丯亣交丳丱三上下並丌丂仉今严乥乤,丟丰仃仙交両乥乤丈三上下丏丌,交仐丈三上乐丢,丟丁交仐亣丮丯丳举乿丏丈下並与乐丂丰仃串今,両仐举亢丯仃丟乴,临乳,一乗仙丁丮丯交仐七丱串両乿亝书乐乙丂丅丢京今乘乛丠乪,丟丰仙丮丯亣交仐丳両丆举乿丈下丌丿丄他两京乪乘,亼于,丰仃丁一乗丮丯丳丱举乿下丿丏丂丠丅亪串丢並丄乪今,他丈三上下並丿与,丟仃丠仙丮丯交仐亣乼両介乩仅丢严乥乤仇他乛两,丟丠丰仃丁丮丯交亣严乥乤丢三丏丂下,丟丰仃丈丌丿下,両丄交亪串乤乥丢乛亗丈下丿丌,丳両乗丂丟丱乘丄乐严乤乥书举丆七並丌丿,丳乗仃乐両亗一仚,临丄乳,丄丠,丳丟丰丂丄乘七丱举丆両串乚乛並丌丿,丟丄亽于亏亿,丟丰仃乗乘丂七丅丱举丆串书乩丈丿並丌,仇丈三上下丿並,丆丟乗丰丂丄乙仿両丱乣串乪,丳乗丰仃丄丱両乚乩乫丟並丌,丟仐交仅京乨両临丈丿丌下,交京乨丢乤乥,丳丟丰仃乗丂乘七丱串乙举丆両严乤乥书丈並丿丌三上,丳亣丯丂乐串乼両亗丣丟丰乗丅乪乽乣,仔乳丟乆,仛丯丮丟丰仃丆丂严乘举乥乤乪両丿丏,丱丈丳下丿並,亼亽于亏乆,丟丁丠什三上下丈並丿仁,丟丽仇並丏丿下三上乆,丟丠主临仇乚,丟丠两乚,丟乗一仙丁丮丯丳交丱乣乘七丆举乿丅亪串乛亗丰仃丄京乾乽乪,丮丯亣七丅丱両丈三上下丿並丌介,丰乗一仙丮丯交両严乥丈三上下丌丿与仟乐丂乤亪,丟亿丽,乗一交亣京七亪串乴乐乼介乽乤丄严乥丢,亣丈三上下乳仔,丟丳丰丯交仐両举乿丈下丿丏丅仉仃乐书乤乥丢介今,丟丰丁丮丯交仐七丅丱串乣下丿丏丠亿享京乘,于亏亼亽,丟丱串丮丯丳乼七両举乿丈下並丿与丏仟丂丆丰仃丄介乙,丟乗一丯交七両乣丱亪串丆举乿严乥书丠丂仃乪,交仐亣丳仞両丈丢,丟丮丯丅丱丰一丁丠七乣举乿亝下丏三上亾仄丂亪串乫仃丄京,丮丯交仐亣乼七両丈三上下並丌丿不与仅乤乥丢仱介丼丽乛京亭,丟丂丳亣両丈下丿,丽仓,乗一仃丯交仐亣乼乨享乪両介丟乐丰仅丢严乥乤亾主亭,丟丳仞丿,丟乐丮交仐乼七串乪丈三上下丌丿与乗一亾丂乣乾今丆举亪乥仅,丟乗一丰丁交仐亣丳七丱丆举丈下丿丏仃亾主京亭乨乘丅乣乾今仟,丟亽于亏乆,丳丟丂亣乥乤乙严丆丅丱両丈下並,严乥乤书丟丰乗举丆両七丱串乙,主亣丳乙,丳丟乗丰仃乘举丆両七丱並丏,両京七丅丱串乥乤乚乛亗丈丿,丟丰仃丁丳亣丂严乤乐久三上丌丿下,丽予丄两丣仇乆仓,丢严乥乤乗両串乽丅乣,丟丰丳亣仔亀乳,丳丟乗丰仃丂乘乙举丆両七丅乪书丢亿,丳乗丟丰仃丂乘举丆丄乚京並丏丿,于亏亼亽乆,丯乤乥両乼丿下丱並与,丟丰仃丁丠乗主仅丄亽与乚亗乫乩,丢乤乥乚两仇他乙久主,丳丮丯丟丰丂丅丱丆举並乘乪両串与下,亣乥乤丅丱乼丈丿並,丟乐丂乥乤亣丢,丟丠丄亿丽亗,丢严乤乥乗仚乐主両介仇,丳亣乐乼丢乤乥亀,丳仛丯丮丟丰乼丆举严乥並丿,丰丁丂丆举丅丱並丿,于亏乆,丳亣丟丂乐丅丱丈並,乗仃丂丯亣乘七乣丅丱串丆万严乤乥丢,主亣丳乙乚两仚,乗丰仃丂丄京乽乣丅亭乪丆举亝三上下丏乛亗,交仅京享七丅丱串付仁丈三上下並丿丌不与,丟乐乥乤交仐丳亣乙,亿丽乆,一乗丮丯交仐亣乼乐丢严乥乤両亪串仇乚丄仅,丟丳仞三上丈下,丰仃乗一丁丮丯丳七両举乿下不丿丏乚丄亣交丆丅丱亪今丌与,丟丄丈三上下丌丿不与丏丠亿两他仇丣主,于亏,丟丂丮丯交仐亣乙丱両临丈下丿並仇他丣,丟乗一丮丯仐亣七丱乣串举乿严乥丢丠仃乘亪乪,严乤乥书丟乗丰仃両丄丅丿,丟伃他丢乛乆,乿乘丯丮丳严乥乤书乗丂丄両乚亀七丅丱,丟丂丅丱仐乏両丆丈下並丌丿什仁丼丽,丟仔乆,丳丟丰仃丁乗乘丆举亪串乐乽乣亽乪仛乫乩,丟一乗丯丳严丂乐両仇三上丌丿下,丟临乳乆,丟丰仃丁丠乛丈並丿,丯丟丰仃丁丂乣乽乾乪丈丿,丟丠丄亼亽于亏乆,丠两丣仇他,丟丰仃丁丯丮乗亪串乴乵乽乣乾乪仓並丈丌丏,丟两丄乆,丯丳丂严乥乛亗乘丆举,丟丰仃丁亣临丢乤,丟丄久丂乆,丠丁丄亼亽乐乏乚主亿,仃丂丄丮丯丳乐乙両严乤乛亗丈三上下丿丌,丟临乳乆,仛丟丰仃丁严乤乼仢乗乽付乣乾乪乛丿什与丏,丟丰乗仃丁丯丮亼亽乣乾万他丄丿丌丏丈,丟丠于亏亼亽丄乆,仓,丟一乗丮丯亣交乼七丅丱両仅严,丟乆,丮丯丳乙乐乤乥丱三丏下並丌仟丂严丢乚,丟丰交仐両丈三上下並丌丿丏与乏,丟乙丳両丄亣丂交亿,丯乗亼亽丱串丆举,丟乐严両丌丿,丟临乫乳,丟丁严丱丈並丿,丳丯丟丰丂丆亼,丟亼亽丄乆,丠仇他,丐,丄亏乆,丳乗丂乘七乙严乥乤书举丆両乚,丳丂仐亣両三上临乤乥丈下並丿,丂仔乏久乆,丟丰乗仃丄京乘举丆両七丅丱乏,丯丳乗丂主乐严両乚亗丈下丌,丟乳丄仔乆,丟丰乗丄丱丢乤乛亿,丟丰仃乗丄乘七举両丅乪乛丌丿,丟丄于亏乆,丽亿乆,丟丰仃乗丄丯亣乘七乙両丱串亝乫乩丈下丿並,丄于乆,丳丰仃乗丂丄七乘严乥乤举丆両丱並丏,丟交亣両乤乥乩丼丽丈並丌丿丏三上,丟丂久亿乆,丟丰仃乗丯丮丄乚乛亗亿乙,乗丂乤丽丳主严両,丟临丣仇仔乳乆,丠丟丄丿並丏下乆,丟丄丈下丌丿予两丣他三上亿丏丁,丟丠丄于亏亼亽乆,丠丽丣仇他亿乆,丳丯丟丰丂丱串丆举並丿,丯丟丰严亼亽丱乛,丳丯丂丆举,丮丯丟丱並乤乥,丳交丟丂両临丆举並丿,丽仇乆,丳丮丯丂丟丰丁丱串並丿,丮丯乐両临乏,丠乳亿丈下並丌丿乆,丳丟丰仃乗丂乘七丱串乙举丆両乪严乤乥书乚並丿,丟乗丂丄一交丈下並丌丿三上,丟丄于亏乆,丳丟丰仃乗丂七丱串乘乙举丆両乚乛亗亪乪丅丄乐,严乤乥丟丰乗京乙両七丅丱乚並下丿,仇丄乆,丳丟丰仃乗严乤乥両丂七,丳丟丰仃丂乘七丅丱举丆両临丽乚並丿,丄亿乆,严乤乥书乗丂七乙举下丱乪串乚並不丿,乙乐,丠乳亿丈並丿三上,丳丟丰仃乗乘丂七丱丄乙严乤乥书举丆両乪串丿並丏,丟丰仃乗丄仐亣京亭乨丅乙丳交両丱乣串亪今乐,于亏丠丄乆,丯丮丳仛丟丰仃乗乘七丅丱乙书举丆両乚丈並丿三上,严乤乥丟丰乗丱両丂乚乛亗亪串丄並,丄丂丯亣亪串丆临乙举乛亗,丟丰仃乗丂严乤乥乚両乛丆乣丱乾介亀並丌不,丳乤乥仦丼丽丣他什,丽亜仇丣乆,丯丮丳丟丰仃乗丄丂乘举丆乚乛亗丱並丈丿,乗丯交亣両临乙介丽,丯丳交主丂丅丱乙严乤乥书丆串乚乛,严乤乥书丟丰丁丂乽乣丅丱乾両乼丿並丌三上与,丳丯丮丟丰仃乗乘丂七丱丅乙举丆両丄书乚並丏丈下丿,丟丠丄于亏乆,丮丯丳丄丟丰仃乗丂乘七举丆両乚乛丱並丏丿不,丟丰仃乗丮丯丄丱乣乙严乤乥丢介乩乚乛並丿,丟仇两乆,丟丰仃乗丯丮丳丂丱並乐严乤乥仄七乣仉今乩介以乚丏丌不与,丳亣丟丂丆举临仛丼丽仦並丌三上丈,丟丄亜乐乆,丳丯丮丟丰亽仛丅丱丆举,丳丯丮乐乼仇亣丟仃乙仅,丟丠丆並丿亿乳,丟丰丁仃乼乛丆举一乗乣亪串临乪乿乘乽丌丿,丳丯丮丁乗丟丰亼亽乐丱丄两乛亗丈並丿,丟丠丄于亏乆,丠亿乆,严乤乥乼乐乗亼亽乽乣丅丱乾亪串乪临今仦乩乚亗乏並丿与,乚两丣乆,丳丟丰仃丁丮丯丄丂丱並仄仚主乐乣丅亪乾両七乛亗今三上不与,乆,丽亜仇乆,乗丂丯丳京亭乘七丆举亝仝万乏严丈三上下丿,乙亗亀丽仇乆,乗丂丳,丳丯丂丟丰严丱丆举並丿,丳丯亼亽丅丱丆举並丿,丟于亏乆,丟于亏乆,丟丁一乗丂丅丱乏両今乫乩仦仇並,严乤乥书乗丄七丱両丅串亀乚並丿,丟仇乆,丳丯丮亣仛丟乗丰仃丂丄京乘举七丅丱串両乚並,丳仐交亣京串乘七丆丅丱乪丢仱乚丽,丂久仮乆,丳丟丰仃乗丂丄乘七丅乙举丆丱両乛乚丢乤乥书乏,乼丟丰仃丠丄丯严丅亪串享仉们丼丽七今乘亿什仁丿丏丌三上,丟丠主予仔乳乆,丳丯丟丰丂乥丆举丱並丿,丯丮亣丟丰丁丂丅丱丆举乿乘七乽乣亪串乾乪乩,丟丠于亏乆,丳乼乤丂丟丰仃丁一乗仐交今乩乫,丯亣亼亽严乥丅丱乼並丿,丟临乆,丟丰仃丁乿丄丆举乐亼亽丱並什仁,丳亣丅丱临丆举丼丽乛亗亭乣乾乩万,丟乤丢,丳丮丯亣乐乼仛丟丂丢举乿乘亾一乗七乣丅丱亗乚乪仦,乗仃丂亣丳京亭享丅丆举严乤乥乿乘书乣什仁丈三上下丿,丟丠主丳临予亿仔乳,乼丆举丂丟丰丁丯丮乿乘丄乐丅丱七乣乾乽両並丿丈与,丟丠两仇丣他乆,于亏亼亽丣乆,丳丂乼丟一乗亽仅両仇丽並丈,丮丯乐乙仢七丅丱乣严乚乛亗丈三上下並丿,丟两他仔乆,丳丯丟丰亼亽丂丱丆举,交临丆举乛,丟丈下丌丿,丮丯丂丰丁両乐,丳丯丂亼亽严丆举丌丿,丳丟丠亿仔,丳丮丯丂严丟丰丱丆举並丿,丮丯丂丟丰丅丱丆举,仓,丳丮丯丟丰丈並丿,乗亼亽丱串丈並丿,丟乚乆,丳乗丟丰仃丂丄京举丆両乘七丅串乚下,仃丳丯仐交亣京乨丅丱乣亪串乪临仱乏,丟丄乆,丳丟丰乘乗仃丂七严乤乥书举丆両乚丱,乗仃丂丄京乘七丅串乣举丆严乤乥乚亗丈丿三上,丟主仔乳丠予亿,丳丟乗丰仃丂乘七丱丅乙举丆両书乤乥乚乛丈並丌丿,丟丰仃乗丂京乘七丅丱乣両举丆,于亏乆,严乤乥丢乩仦仇丟丅丱両今仅並,严乤乥丢乚両七丅丱串丈丿並三上,丟临乆,丄亏乆,丅丱乣乪両乚仱丼乏,丟久亜乆,丯丮丳丟丰严丢乥丆丂丅丱乣乾亪七亿今乿両万乩乫乏乚,丳乗丟丰丂丄丆举严丢乣丅亪串乽临乘乿丼丽七今亿介万乚丿,丳丟主临仔乳予丠亣,丳丯丮丟丰仃乗乘丂七丅丱乙举丆両乤乥书丢丈丿丌三上,丣两仇他丟丠乆,丯丟丰丄丱並丿,丟于亏乆,丳丯严丂丱串丆举並丿,丳丯严丂丱串丆举並丿,丟临丢两,丳严乥丟丰丱丆举,丼丽仇丈三上下丿丌乆,丳丯丂丟丰丄丆举,丳丟丰丁亽並丿,丳丂严両丈丌丿,丳丟交仇亣丠,举丆両乗丰仃乙严乤乥乘七丅丱,丟丄丠予丈下並丌丿,于亏乆,丳乗丂主乨乘七丅严乤乥书丱举丆両乚,丳乗丂丰仃丄七丱丅乙严乤乥书举丆両乚乛丈下丿,丟临丢乚乛乙,丟丰仃乗严亗主,丟丈並三上下丌丿丏乆,丟丂乤仮乏,丳丟丰仃乗乘七丅丱乙严乤乥书举丆乚乛丈丌三上,丳乗丄両亗主严丈丌下丿亿,丟丄乆,丟丰仃乗京乘七举両丅丱串书乛,丄丟主丈丿並,于亏乆,严乤乥丢丱乗丂丳丯丮亾乴乵乛亗乚並丌丿与,丳丯丮丟丰仃乗乘丂七丅丱乙严乤乥书举丆両乚丈並丏丿,丟亣临乤丢乚仇乛亗乙,丳丮丟丰仃丯交亣乗両乨丅丱临乣串乽乛亗,仅丟丠丼丽三上下丈丌与,丳丟丂交亣乤仢丢乏仛久,丅丱乼丟丠丄七亽临乽乣乩亿乏什仁丿並丌下丈与,丳丯丮仛乗丂七乣両三上严乤乥乚亗丈下丌,丟丳丣仇,丯丮乐亾丟丰仃乗丂丄主丱乣严乤乥丢介乚乛亗,丟丰丄予両丠丈下並丌丿丏,于亏丄乆,丳严乥丆举乼乐仅乪両书七乴乵乩乚乛亗並丿丌下丈与,丳丮丯丟丰丁乗乐亼亽乽乣亪串乪仉仱乩並丿三上,丯丮丳丆举丂丟丰丁一乗乿乘乐丄亾亪串七乽乣乚亗乛,丯丮丳丟丠一乗乘亽仄京乽亪串両临仉书乫乛,丟丈三上下並丌丿丽亜仇,丟丅丂乽亪仛久乏仮,丟丠一乗亾丄亿亽乩亗,丢严乤乥丂丟丰仃乗丄亿乣亪両丆乴乵丼丽乚乛亗,丟仔乳,丮丯丟丰乗乿乘乥乼丆举亪串乐両七书亗久,丠主两丈下並丌丿,亼亽于亏乆,丯丮丳丆举丂严乤乥丢乐乿乘七乽乣両临书丿並丌与丈下,丟丰丁丂丯丮乼乘七丅丱乣丆举亝丈三上下並丿丏,丟乙丢乛亗两乆,丟一乗亼亽丳乐今乫亗乛以仉,丟丽仇丣乆,严丢丟一乼亣乐交乴仅乛乏久亗,丆举亽乐丟丰丁乿丳乽乣,一丂亣丳乙交仞乏乤乥亗什丈三上下丿丌,丟亣丳两仇丣他乆,丠亿乆,丳丟丰仃乘丂乗丄七丅乙乿乤乥举丆両丱並丏丿丈三上,並丿下丈丟两三上乆,于亏亽乆,丳乗丟丰仃乿乘丄京举丆両严乤乥乚丂丿,乼丯丮丟丰仃乗仰丂乘七丅丱乙严乤乥丆両乚串乛並下丿,丳丟丰仃交亣仅丅乙両丱亪串丆乤乥乚乐,丳丯丮乗丟丂主丱両今以乚乙,丟丂乨乘七丅丱乣両丼丽丈並丿下乏,丳丯丮丟丰仃丂丄亪举丆丢串乛丈丿丌,丄丟丰仃丅丱亪串両乛乽付乣丈並丿,丠主乐一乗乚亗丳仅丼丽,丟主临丠仔乳,丳丯丮丟丰丁仰丆举丂乼乗丅丱亪串乽乣乾乪丿並,丟仰两丄仇丣丈並丿,丠于亏乆,丮丯丟丰乿乘严乥举书仝丌丿,丳丟丰丁仰丆举丱亽严乤乥乗丅仛乿両两丣仇,丳丮丯临亣交乐乛亗乼严乥丢両,丳丮丯丟丁仰丄丂乐严丢丅丱亪串乗乴乵乛亗乩並丌,丳仰丟丰丼丽亜仱丈三上丿,丳亣丟丠仰丂丢亿乛仟,丟丠主予亣丄丈下並丌丿,一亣丳乐乙仅交乚乛亗丼丽两,丂丠丮丯交亪串丆乛亗,丯丮丳丟丰仰乗乿乘丆举亪丅丱串乣乽乪亝仝並丌丿,丟两丣乛亗丈三上下並丿丌,于亏亽乆,丰丁丂亣丳仢享举仝严乤乥丢丈三上下並丿丌,丰仃丄丮丯丱乣今介严乛亗什丈三上下並丿,一乗丄丮丯丳乘丅丱丆举七乣乪仳严乤乥丢乛亗,丰丂丮丯丳交丱両今严乫乤乥乚以三上下並,丳丟丰丁临丆举,丳丂乛丟丈丌丿,丮丯丟丰丅丱串並丿,丮丯丂乐丅串丆举,丠仔乳乆,丳丟丰丁丱丆举,两仇丈並丿,丠亽于亏乆,丳丮丯丂严丟丰丆举丌丿,丳丮丯丟丰亼亽丱丆举並丿,丮丯丟丰乼临乛,丳丟丰仃丂丱両乫並丌,丳丟丰仃丂乘七丅丆丱両丈並丿丌,丟丰仃乗丂丄串乽丆乪丢亗乛丿丌丈,丟丄丠主予丈下並丿亿,一乗乙乛丼丽乚亗,临丠仔乳乆,丟仃乗丂京乨乘丄七乙丅丱乣両乚乛丈並丿三上,丟丽丈並丿下乆,于亏乆,丟丈下仇丌丿三上乆,丳乘七丟丰乗京丱严乤乥举丆両乛丈丿,丟乗丄乙乤乥丢乛,丳丟丰仃乗丂丄両乚下乙乐三上,丟丱仱乩乐丽丈下並丿,丟交乪丢亿丂乙临乛乏,丟丄七丅丱乣串両乪以乩丈並丌,丯丮乗丂丄乿乘七举丆丅串両乚乛乐乼仅,仔乳丟丠临,丟丰仔乳丈下,丟乐丯丳乗一丁乿严乥三上丈下丿仟乙丂交丅丱串仅乤,丟亣乐七乣三上下丌丿丠两乗一,丟丠于亏乆,丟一乗丂丄丮丳七乣両举严丈三上下並丏书享乤,丟乐乙丱串乗一亣七乣両严乥仟仅,丟交亣丳仞乐三上下两乙丈,仓,丟交亣丳乼七丱乣丆举丈丌丿介仅,丟丂上三丠丈,丟丠仟丂乆,仓,丠丈下三上並乳,丳丟丰仃丠乘丂七丅丱乙严乤乥举丆両乚乛丈丿丌三上,乗丄乣丱七串与不丿並丌下,于亏乆,丳丰仃丂乘七丅丱串乗乙严乤乥书両举丆乚京丈並三上,严乤乥书丟乗乙举両乘七丅丱乚,丟主乐乙丳仚丈下,丟与不丌三上乆,丳丂京七丅丱丆丿並不与,丟丂亿乆,丳丟一乗丂丄主予丱両乩今亿,严乤乥书乗丂举丆両乘串,丟丠仔乳乆,丳丟丰仃乗丂乘七丅丱乙举丆両严乤乥书乚乛丈丿三上,丄亏乆,丟亽于亏乆,丳丯丮丟乗丂主乨乘七丅丱乙举丆両书乚乛並丿丈三上,严乤乥丢书乚丟丰乗七丱両,丳丟主乙临下亣乐,丟不三上丌下乆,丳亣乼丄乛亗丠京亭乨乪亿仁丿丌与不,丟丂丠亿丿乆,丳丯丟丄丂丅丱严串両予亿亼亽乣乾乽付,丯丮严乤乥书丢乚乙举丆両乗乘七乪丅,丟丠仔乳乆,乗丰仃丁丅丱丢介仦乚亗乐,乗丄七丅丱亪乪亗丿不並下,于亏亼亽乆,丳丯丮丟丰仃乗丂乘七丅丱乙举丆両串付今乫並下丏三上,丳丯丮丟丰仃乗丄乙举丆乘両严乤乥书,丟亣两乆,丟丄仇丣他乐亾下丌三上,亣丠丂丅丱丆举並丿,丟丂,丳丮丯丟丰丂丅丱丆举,丂严乤乥乼乘串丆,丟丠仔乳乆,丳仛乼丟丰乗乿乘丂严乥丅丱丆举並丿,丠两丈三上並丌丿,乆,丮丯丟丰乿乘丅丱串乪乣亪乾乩丆举乥並,乗仃仢丳丮丯乘七丅丱乣串今丆举介万严乩乛亗书,丟丳两,丟仰丄乐两丣丌三上下,丂丄亣丳京亭享丅丱丆举什仁丈下並丿不,丟丰仃丂丠乤亿久,丂丄丯亣仢丅丱乣串付両丆举严乚仦,乗一丂丄亣交书临严乩仦丼丽,丯丮乐丠主交亣両三上丌下丿什,丄丟仔乳乏乆,丈並丌丿三上乆,丳丟丰仃乗丂七丅丱串両乛丈並,丟丠于亏乆,丟仃亣乙乐乪両仅丢亗丣今仮,丳丯丮严乤乥书丟丰乗仛丂举丆両乪七丅丱乚丿並丌三上丈与,丟亣丆乐丢主两,丟丰仃丁乗丂丳亼亽丱並亾乣亿亪串乴乵亀乚亗什丏与,丳交亣仐丟丂両丆丽丈並下丿,丟仛丂丅串乽乪両乏久,丟乗丂丄京乨乘七举丆両丅乏亿,丯丮严乤乥乐乛亗亢丆丄仦亾乣両乴乵丿丌丈三上,丟乳乆,两丣乆,丳丯丮丟丰仃丁乗乿乘亝丆丂举乣亪串両乛两仞丿,丟丠丄于亏乆,丮丯乐乤乥丢乚乛亗,仛丳丮丯乐丟丂严乥丆举並丿,丟临丢两丣乆,丳丮丯丟丰丂亼亽乘丆举,亣丟丠临主予亿丼丽丈並丌,丯丮丳丟丰仃亀亼亽严乤乥乐丆亪串乽付乪今两乛,丂仛乏丄亣交乨仢乐丆举乼严亿,丠主亣両严乥乐乤丢仇久,丟乏仔乳乆,两仇丈三上下並丿丌与,丟丰仃丁亝乘乼乐严乤乥丢仄仅亼亽乩仦丣仇乚亗丿並丌,于亏乆,乐丳丮丯仞七丅丱乣亪串両丢,丟一乗丰丁丂丮丯交丳七丅両举乿丈丌丿丏仟乐乙丆串仅严乤乥丢,丟临丈三上丣,丟丰丁丠亪丮丯丳七举下丌丏仟乘乛,丳丟乼丈並丿,临乏,丠主亾仄乙,乗仚乐丌丿,丟仇乏乆,丈三上下並丌丿,丳丮丯丂丟丰丱丆举並丿,丟丄于亏乆,丮丯乐乼丢亗,丳丮丯丂严丟丰丱丆举並丿,丟丽乆,丟丰仃乗严丂丄丱乣亀乚,丟丄交主両临乏今仱丼丽予亿,丟丂交亣乐乏丳亪串丆丢乛,丟丰仃乗丂丄丆京両乛乘七,严乤乥丢乐乗主丈下丿丌,乏乳乆,丈並丿丌三上乆,丟丈下什並丌丿三上乆,丟丄于亏乆,丳仃丯乙丢仇乛亗乐,丳丟严乗丂举丆乘七丅両,丳丟临丢,丳丟丰仃乗丂丄乘乙严乤乥书丢举丆乚並丏,丳丟丰仃丱両亿丈下並丌丿临予丼三上,丟丰仃乗丂丄串举丆両乪丢乛乏,丟乗丂丄主京乘七串付両乏,丟乐丳丠丅丱丰乗一丂丮丯交丈三上下丌仟亪串丢亿乚乛京,主乐丼丽仇,丟丰丮丯交七丅丱乣両丆举乿三上丈下丿丏仟乐乙丂亪串仅严乤乥丢乴,丟丰丮丯交七丅丱乣両丆举乿丈下丿丏仟乙乐,丟一乗丮丯丳両乙丈三上下丌丿与,丟丄于亏乆,丟丄丰乗一丁丮丯交亣七丅丱丈三上下丌両仟丂丆亪串京乚並丿乛,丟丰丮丯交仐亣乼両乏丈下丌丿丏三上乐亪串仅严乤乥丢乛仱,丠亿乆,仓,丰丁丂丮丯丈下並丿与仇,丟丠丂亣乙乆,丟丰丁一乗丮丯交亣丳七举乿丈下主丿不丏仟丆丠亽並丌予亾乨,仓,严乤乥书丢乗丂举丆両乛丈下丿,丳丟丰仃乗丂丄乘七乙举丆両乚丱丅乛丈丿与三上,乗丄七丅丱両乛丿丌丈,于亏乆,丳丟乗乘丂七丅丱丄严乤乥书丢举丆両乚乛,丟丰仃乗丄主乐乚乛亗丿不与丌,丟丠仇下丈三上,丄乆,両丟乩丼丈下並丌,丟丠乆,丳乗丂丄乘七丅乙丱举丆乚乛乫丿三上,乗交乪乐両仇主,丳乗丂乘七丅丱举丆両串严乤乥乚,丳丟丰仃乗乘丂七严乤乥书京举丆両丿,丟主仚丄乙予,于亏亼亽乆,丯丮丳丟丰仢丆严举丂丱乐亾丅乣乪両亝丄丢乩乏亗,丟丰仃乗丄京七丅乚乛丿不与,丠亿两丣丄丽乆,丳亣丟丰仃丁乗丂丄丱严乤乥书七並,仐交丳両丈下並乏,丄仔亣丂乆,丯丮丳丟丰仃乗丂丄乙严乥书举丆乪乚丱亼亽乐乣丅乽丿,丟一主乐亗乩乏丣仇,丂丢严乤乥丱丆举交乐七乙乿仅乵仔乳,丳丯丮丟丁乗乿乘丂七丱丰乙丢乤乥丆両丅丿三上,丳丯丮丟乗丂丄京乘举丆七丅乚丿丈,丟丄于亏亼亽乆,丟亿並丿三上丌下丈与乆,丮丯乐丟丰丅丱乼並丿,丟丠两丣仇亿,严丢丂丟丰仃丁亢亾乣乾亀以乫七乚乛亗丱並丌,丟主亀丽三上下丈並丿,丟丠丂乆,丳仛丂乐丆举丅丱仢乗乿乘主乽付乣们乪七亿乚乏,一乐乼丽仇交仅,丯丆丢严乤乥举丅丱亪乣乾亝乿乘仔乳乐丂乩仦,丮丯丢严乥丟丰丆举丂乽乣丅丱亪串乪乿乘久乐並,丳丮丯丟丰一乗丆両京乨两丣仇亼亽丄丿三上下丈与丏,于亏丟乆,丳丯丮丟亣交京乨亭乾享临丆両丣仇乩仦三上丌丈下丿,丯丮丟丰仃丁乗乐丄亾丢乤乥仅乣丱乾乩乚乛亗並丈与丿,两丣乐丄丈三上下乆,丟丰仃丁丠亣丂主七丄乣丱乾仉乩乫亿三上下丌与丏,丳亣両丯乐丽两亀乏,丟丠乆",
  ji: "丁举丅丱並,丁京乨丿乑,丳丱並丰乘举,丳举丯丮乫,严亝亀乫,什並乑丿,丆举,临乪仝严丿,京乨丱両乚仝,乐丿举丆両严乑乘临乪,丳严乘乙丈仟举丆丂丿,丳严両乚丿丰乗乫,举丆仳临乘乿丱丳乫亿仝,並丿乑什,丰乘丳举严並,丆举丳乫丿,严丯丮临亝万仅,丂乫並乑丿,丳丆举乜丂乽,乪丱並乑丿上,丳丱両仝乫,严丁並丿,丆严举丿,丳丰乗乫丿乑,举丱並丳临万,丁乨乫乑丿,丳丆举,举丅丱並乪串,乫京丁临,丂丿不严,仓,乗乚亽乪临,丐,严並,丳临,举丿,举丱並,严丿,丳丰,仓,严丳,严丿,仓,仝乪主亝乚临,仓,京乛串举临乏丳丿乨万乪,丳丂仟乽丈举丆乘乙丿,丳丰乫乑丿両,乆,临一乑乧京丿,举丆临丰丟丳丏乫乽乜,仓,丳严临亀乨京,仓,仓,乪乚临亽,仓,京乛並丿什丳严丱乤乨,丳乙丿丂仟举丆丈以,丆举丳丰乗乫,乴丳丆举,仓,临丟串丂,丐,丳丆举乗,丂亽丿严,乽严临举,仓,举両,並京,乴乽丿両,乚丈丿,临乫丳举,丐,丳丟丂亀,丅串举丰乜乫丱乪丿临,丐,乫丿乚丂临严举乪,乫丿乚丂临严乪,仓,両京丰乛,丐,仓,丳乚丿主亝临丈乑仝,亀丳丂乗乚丱並举亽,丳丱乩丿,举乪丟丏,乫丰丏丱举串丅临,丆举乫亝乚仚亽乩,严乑乚丂乵丿亀乧亽,京严乤串临乪乽,严丱並,丰亝丟両丏,丳举临丯丮,丳严举両並丿,丳仐举乑丿,举亀丳丱乚严乗並,丳举丂丱並丿乑,临丿丟严丯丮乛丏丂乜,书举串丰乧乨临乩乪丱並乫,乗丳乴乵万丿乜,严丂丿乑,丯丮丳串严丁乽乪,丁丳严,丰丳両举万,亝举丅丿乑丳,严両丿不,亝丳丂丱丿乑,乗丳严丱並,並丱丿,乜丟丂串乽丏丿,举乗丱,丆举亝临亽丿,丳丿,乽严丱並,丳严丿,丰丳亝両丏,严京丳乨,严両,丳丈丿丂,举丿京乨乛乏临,乚乗丂仚丳举丱並,举丂丆丟丳丱並临,丆举乘临乫,丳严丱临丿,丟丰丿乪,仅乜乽临丱,严丁,丳丿,両临万乐,丳乪丆举丿,丳严丿並,丆举乘乪丿,丳丱乗乽並,丟丆举丱並,乗丳临乫乛,严丱丿並,丳丰乫丿,亀乽付乗乜乪临,乗严举丱乽,举严丿,両乚亽临,乆,京临丿他举,丿串举临,丂丳举丱,丟丰丆丳举,乫,丁临丿,丟丰丿乪乆,乽乚丿临,乚丱严临,仓,临両,丳串举临,丿临京乨,丈丿临举,乗乫仚丂丳举丆临丱,丳丂丱以举丟乫,乫乧,举丆乘仳乿临严乤乥丿丱京,乚丂丰乑乛丿乪京乨亗,仓,严乥主临,乆,丳临両,仓,丳丿並乨乛亗乑临,举临京丿乘丂乛,乧乘举,仓,丐,举临亽丿丆,仓,乗乽丱临乚,严临両举串交,严丳,严丳両乐举临串,丳举,丳乧乑丿亗京乨严乛乏,丳举丆临丿,乚丿,临乗丳严举,临乫丱乚,乚临丿丳,丂丳举丿,乽临亽乜,乚京,両严乥临,仓,乗乵,丳乚京丿,临严丿乨,临丿严乽,丟乗丳举,乫丱临乚,乪临丿丳,丂丁丿丳,乚乽临举,京乨,乪,仓,乗临丁丿,丳乑亭乨主亗丿乛京,亀京乛乏丿並乨临什,仐严丿丈,丳丟乗丂乘丆举乪,丱丆举,丳临乫丿,丱並丿乑仟丂丳举丆丏乧,乴乵乽临严乤乥乚,丱京丿乑,严乤临丢串両乽万,乗丳,丳乗临,丳乾仁丿乑,举乽亪丿,严乤仐丿,丳丰乘举,丳丱乫乣乾並,丳丿乑乪,丆举乚,严乽亽临,乛主仁,丯乗両丳严,丳丆严举,一乗仝三上,丰丳丿並,丢严丿並,丯丱严乤,丟丳丂乫,乚丱丿乫不乜,仓,临丂举丿,丱临举乗両,仟,両丳临举,仓,乨亝,亝丳京丿,丯亢丮丳举乴乘丱並乛京,丳举,临丿丟丈,举临主乗乪,乗丅丱並,丯丂不丿严乥临,丰举乽丱並乜,両举仉乚,丆举丳丂両,丳严丢乘,丰丁严丿,丟丳举临丿,乘丳严,丳丿,丰丱並丿丈,乗丳乫丿乪乜,丱並乑乗乨丿乜,严丳丆举乫丿,丰丅丱並丏,丳丿丱両亽,举丱乴乵,严丱乫乩,丳严乤举丿,丐,乘举丿京,亝丳両,丈丿举両,乫乪丳丯,乫丱並丿乗,丳严丿,丳丱並,丳丿,丳丆举,严丱並,仓,丳举丿,仓,仓,丰丈丟临丿乜,乧乗严,仓,丳丢丿丂严乥临乚,丏丰串临丁丅举乪,仓,乙丂丳亀両仟丿临,丱並丢乫书严京乤,仓,仓,丐,仓,丟丈丿乜,丳乫乜严乗乚,乗京丿並,不仝临丂丿乽举,丰乘亀丱並丿丅串举,丳両亽,丁乗丳举串,丱並,丳严,丰丿,丁,丳丿,丱並丿,丳丿,仟两,仓,丆举,严丿,仓,丐,丳串丅七亭举京丱乘享,仓,丐,举丆主乘丳丂,仓,乛举丆丿乜京串乪丈丱,乗乫乴,仓,丳両乜临,丽串丱京丿乧,丳丆京乨両丟丰乽,丐,丐,仓,严乥,丳乫举丆丿,丟京亭両丅丱丿不並,举丅乪京丈丿乽,両以串丅严乗举丆,丳丿举丂丱乧,临両乴乽,丳乚丅丱丂京乨丿丏,京丿両丟丰,临丳丆举主,严乥万仁,乗丿,临严仅,両串交举丳,乜丳严,举乪丿,乽仝乪丿串,丳丿,严丂両临丿,严临丱乑丿,丰丳举両临,丱並丳,丆举乽亭,乑丿,丁严丳临,丳乘丆举,严丱丟丁丿乜,严举乜乘乽,丐,並丿,丐,仓,乐乙丅丱乣丆严乛丈三上下並丿不与,乪,严乗,仓,丆举乴乵,乘举,临乘丟丳举,举丂乫丿,乑亀丿,両丰丂丿乑乗,丁乽丱並,丿什乑,丳両临丱並万,严举丂丅乧,乗临乽亭乴,丳严仁丿,举丳丆,临主仝乑丿,丁丟丆举串丳,严丿並不乫,仐串仅丿丈,丰乗乫严丿,丁以串丱並,乑京乨临,両乵临丱並,丁丂亽仁,严京乨临,严乤丳丿乑,丳举,严乪乫临,丐,仓,严乪,丳丿,串丱並,丆举丿,丱並,乑丿,临,严丿,丐,乗严,丳,仓,丿严乤乥,丿丂丰乚,仓,丿乑京乨,亀両,丂乪丅丳串举,丐,丳严乤乑丿不,仓,丳仝乧丆乪临乚,丳乘京丟举丆乛乜,仓,仓,丳乫举丆乘丂乑丿乗主乙,丁丆举丱,乑丿並临京丁,丯丮両丏並丱,並丂乚,乫並,丳严丿丌乑,丳丆举,仓,丟丰,仟,严並,亝丿,仓,丱丿,严举,丰丱並,乴乵亀丿丱並乫乚,丳並亀乚丿不乑,丳举丆临严乤乪乚,仓,京丟乛,丐,丿仅不並严両丌与,丳丂丿丈举临亣串,丐,丳临丿丱乧乨京乫並丆,丐,临丱串乚举丆丅丰,仓,丳乚乑主不临,丳严乘临亀丁举丆乪,仓,举丆临丟丏,乫京乛仁,以万両丿並丂不乫严什,丆乚丂乑並丿乧,乗亽丳乫並丿,丆举乚丱並临丿乑京串,严举丂両,串举丅丱並丟丰丁,丱並亽以,丳临乘亀举丿,丳丁严乘举丆丂临乪京,丳丿,丟丰乜丏仝,举严乫乧仁,丿並严乴乵丌,丂丿仝,严举丳乗乽,丱並乫丿,丳丂丯举临,丁举乪丿並乑,严丱並丳丅丿,丳丿乑並不,乘丳举临串丱,丳丂,丰串乴乫亗,丳严乚仁,严举両丱丿,乽举临亾丿乑,丆严举丳乗乪,丱並丿亽,严両丂仅,丐,丐,仓,丁严乴临万,丳举严乤,丰丯丮丳举丿,乫主临丱並乩,举丳乫亗,乑丿丂乨乛京仝,举串丈乽乜临乪丿乛京,丳举丁乗仚乫,乚乫丱両並亀,乘丳乗乙丂乧严举丆仟,严举丱並丿临串両乴丰,丳乚丰仝丿乪京乨,严乥亀临仝,严乤举丳,丁严,丱並丳乫両,丯丮仅乑丿乜,乫丂並乑丿,乘举乽乪丿,丱並乫乗串乧,严丱並両乴串,丳丂举严乪,丰严丱乑丿,丳乪丱丿,严乥丢临,丳丯丮严举,乑丿,丱丮両乩,丐,丐,丐,丱並,临丱並,丳严,严丿,丳丰,严丿,丳举,仓,丱並,乗仚,丱丿,举乨乪京丅串丈乽,乽乗主万乫临,並亀乫丱両,丳乐乙丂举丆仟临,丳丢丰丿丅严乤乥丱串,仓,丳丆,仓,仓,仓,乚临仚丂,丱並丳主丂举丆仳乿乘,乽丈丿京举丆亀乛,乗丂丅串举乪临交,両丱丿什仁,丳丂乙临举丆乚仟,京丏乑丟临丱並丿丰,丳乧亽亀乨丰丿乚京乪,丳举串乪,举京,临举丳,丆举丂乚,仝亣乽乫,乾丿,丆举临,丈丿严乤,両乗严乤,丱亣丆举严亪串,仓,丐,丳丆举严,丐,丳丂両临丟举丆乘乙亀,仓,丐,丳与丂京丿乑丆乛,乜以丿京临举,丐,乫丰両严举书乗,仓,京乑临乨丿,临乑主伀丳丿,仓,丐,仓,仓,严乫以仝万,丳並乙丂举丆乘乛乧丿,乴乵京乛严串乽並丌乚,严举丳丱並丿,丰乗严举丱,丱並亀乫,亝乑丿京临万,丁丳乑丱临丿並,丳举両丂,临乘乙以举丆丟,乘举丆丰丟両严丳乜,丆举,严乴乪丿,丿乛丂乑京乚亝仝,丳严乽乨仁,严丰丱並丈丿万,丳严丟丰丁丯不,丳举丅丱乐並,仚京乨亝乑丿,丳丿丱仝,丁丳丆丂串举,丯丮亭乧以,丟丳両严举乜串,乜,丳亝仝万临丿,乑丿仁,乗丱並严丅举乪,丳严丱乫乩丿,丟丰乗严両,丱临乑丿不,亝乪乑丿,丐,严举丂丳不丰丱乪丏串,丳严乤举亾丿,严举丟亀丼丽,举丆乫主京乤严临,丳举串丂丿,丰丁丯丮丳举丿,乜乛京乣乨乽,丳严乩仦並,乪両交举丿,严乚亀乧乪乫乗,乵乴丱並丿乑京以乚,亝丳乫乚仝临丱,举串丁乘丏,丳严,严乤丟举丿,严並乫仁,严丳,丳严举丰丿,串乗乽亭仁,丱並严丿,严乴乵両乪丿,乗丳乐乚仚丿,亝万丱並丿,丳丱並不,丆举丂丰丳,丳严両乫,丳丟举乽丆,乗丳乫京乨,仓,丂丰丿临,乴亣京乨,乚丱丿严,临丈丿両,丱串,乑丿,丳举,严丱並,丐,丆举,严仟,丐,丰丿,丁乪,仓,丳临不乪举与丿両,丳乗乐乫乪乚,丱京乨乑丿什,丿不临並亝丱丳丯,丳临乘丂举丆両丰串,仓,丐,丐,仓,串临京丂丿乪主,乛京亀乨乑丿不与,丿严不与,両丿,乗乚,京乑並丳丿以,丳丿乑乧仝临並丱,举临両乴,丳举乪丆,临亽京乨,临亽,严乤並临,仓,乽亽,丳举亽仟,仓,丐,举临,丳丱丿临,严,丐,乚並亀丟丳丱临丰,丐,丳严乘乚並举丆乿仳乫临,仓,乜丿,举临乧丆丂仟,両严乤乵丿不丳临,丐,举丆丳乫临乘乙严乗,丐,亀両,丳亣丂丰丿京举丆乘乚丱串,丰丟京乫临丏,乚乫亀,丳丱万乩乫丂丅举串丆丿並临严,丳丿,串乴乵乽万,丳乙举丆乘丂,丳举严両並不,京串丅丈主乐举乪丿临,亀万乗乫临,严丱並丳丿,临仅両,丰丏丿串临严丳丂举丱,亝丏临乨京丿乑不乜,亀乫乧乚,並丱乪临严乤,丳丿,丳举丅丱,丳丆乘严举,丳丯丮両丱並丿,丆举乘丈丿,丳举両乫乗,严丱並乑丿,严丯亝両以丿,丳严丰丁丿,乴乽仝丟,丳丿乫亀万,严亝丱並,丳丿,乽万丱並,丳严举乘丆,両乪並不丿,丆举乪乨丿,乗乫丿丏不,仓",
  js: "亞仑乒乶乇么义,亞乶亮乓也亲亐买,丑亞九乞亯亰乷乭乮亚习乊,丧亞乬乔习亄乊,亞专亟亂乯产,亙乔亱,亙亃亳争些丙,乕,亦丒专且丕世丗丘丙,丒丨丗丩丙,乒乶丵丶,乶乀,丑乇么义乊,丧亮乓也亲乔亐买,九乞亯亰乷乭乮亚习,亞乬乔习亄,亞专亟亂乯乔产,亞亙乔亱,亦亞亘亃亳争些丙,亞乕,丒乒乶专且丕世丗丘丙,丒乶丨丗丩丙,丑丵丶,丧乀,乇么义,亮乓也亲乔亐买,九乞亯亰乷乭乮乔亚习乊,乬乔习亄乊,亦专亟亂乯乔产,亙亱,乒乶亘亃亳丄些丙,乶乕,丑丒专且丕世丗丘丙,丧丒丨丗丩丙,丵丶,乀,乇么义乊,亮乓也亲乔亐买,亦九乞亯亰乷乭乮乔亚习乊,乬习亄乊,乒乶专亟亂乯产,乶亙亱,丑亘亃亳争些丙,丧乕,丒专且丕世丗丘,亞丒丨丗丩丙,亞丵丶,亞乀,亦亞乇么义乊,亞仒亮乓也亲亐买,乒乶九乞亯亰乷乭乮亚习乊,乶乬习亄乊,丑专亟亂乯产,丧亙乔亱,亘亃亳争些,乕,丒专且丕世丗丘丙,丒丨丗丩丙,亦丵丶,乀,丑亞仑仒乶乇亲亳,亁丧亞乶乓乕,亞亦乞也乔世习义乊,亞乬乭乮乯乔义习买乊,亞乷,专亂亃亄,亥亦么争丙,乒亐,丒亘亙亚丗些丙,丒专亟且丕丗丙,丑乶产丘,亁丧乶亮乀亯亰丵丶亱丩,乇亲乔亳乊,乓乔乕,九乞也亄习义,亞乬乭乮乯乔丨习买,亥亦亞乷乔,亞乒专亂亃亄,亞么争丙,亞亐,丑丒乶亘亙丶丗些丙,亁丧丒乶专亟且丕丗丙,产丘,亮乀亯亰亂丶亱丩,乇亲亳,乓乔乕,亥亦九乞也乔世习义,乒乬乭乮乯乔丨习买乊,乷,专亮亃亄,丑乶么争丙,亁丧乶亐,丒亘亙亚丗些丙,丒专亟且丕丗丙,产丘,亮乀亯亰丵丶亱丩,亥亦乇亲乔亳乊,乒乓乔乕,九乞也世习义乊,乬乭乮乯丨习买乊,丑乶乷,亁丧乶专亂亃亄,么争丙,亐,丒亘亙亚丗些,亞丒专亟且丕丗丙,亥亦亞产丘,亞乒亮乀亯亰丵丶亱丩,亞乇亲亳,亞乓乕,丑乶九乞也世习义乊,亁丧乶乬乭乮乯丨习买乊,乷乔,专亂亃亄,么争,亐,亥亦丒亘亙亚丗些丙,丒乒专亟且丕丗丙,产丘,亮乀亯亰丵丶亱丩,亞丒丵丶亱丘,亞亳丩,亦亞乒乶乀乯乔乕习乊,亥亞乶乇也乔世习乊,亞乓乭乮亃丨义,乞买,九乬专亟乷亂丙,丧么亄亐争,亁丑亯亰亐争丗丙,亮亚丗丙,亘专且丕些,丒仒亲亙产,亦丒乒乶丵丶乔亱丘乊,亥乶乔亳丩,仑乀乯乕习,亞乇也乔世习,亞乓乭乮亃丨义,丧亞乞买,亁丑亞九乬专亟乷亂丙,亞么亄,亯亰亐争丗丙,亞亮亚丗丙,亦亞乶亘专且丕些,亥丒乶亲亙乔产,丒丵丶亱丘,乔亳丩,乀乯乔乕习乊,丧乇也乔世习乊,亁丑乓乭乮亃丨义,乞买,九乬专亟乷亂丙,么亄,亦乒乶亯亰亐争丗丙,亥乶亮亚丗丙,亘专且丕些,丒亲亙乔产,丒丵丶乔亱丘乊,丧乔亳丩,亁丑乀乯乕习乊,乇也世习乊,乓乭乮亃丨义,乞买,亦乒乶九乬专亟乷亂丙,亥乶么亄,亯亰亐争丗,亞亮亚丗丙,亞亘专且丕些,丧亞丒亲亙乔产,亁丑亞丒丵丶亱丘乊,亞亳丩,乀乯乕习乊,乇也世习乊,亦乒乶乓乭乮亃丨义,亥乶乞买,九乬专亟乷亂,么亄,亯亰亐争丗丙,丧亮亚丗丙,亁丑亘专且丕些,丒亲亙产,亦亞丒亘些,亞丵丶乯乔么,亞乶乀亙乔亐习丘乊,亞乒乶乇亃亚习丩乊,亞乓也,丧乞亯亰乭乮产,丑九乬亱义乊,亮专亂亳买,乷乕争丙,世丗亄丙,亦仒亲丨,丒专亟且丕乔,丒乶亘乔些乊,乒乶丵丶乔么,仑乀亙亐习丘,丧亞乇亃亚习丩,丑亞乓也,亞乞亯亰乭乮产,亞九乬亱义丙,亞亮专亂亳买,亦乷乕争丗丙,世丗亄丙,乶亲乔丨,丒乒乶专亟且丕乔,丒亘些,丧丵丶乯乔么,丑乀亙乔亐习丘乊,乇亃亚习丩丙,乓也,乞亯亰乭乮产,亦九乬亱义丙,亮专亂亳买,乶乷乕争丗丙,乒乶世丗亄丙,亲丨,丧丒专亟且丕乔,丑丒亘乔些乊,丵丶乯么,乀亙亐习丘乊,乇亃亚习丩乊,亦乓也,乞亯亰乭乮产,乶九乬亱义丙,乒乶亮专亂亳买,乷乕争丗,丧亞世丗亄丙,丑亞亲乔丨,亞丒专亟且丕,亞丒亘些乊,亞丵丶乯么,亦乀亙亐习丘乊,乇亃亚习丩乊,乶乓也,乒乶乞亯亰乭乮产,九乬亱义,丧亮专亂亳买,丑乷乕争丗丙,世丗亄丙,亲丨,丒专亟且丕,亞丒专且丕乯乔产,亞乔亱,丑亞乶亘乀亯亰丵丶亃亳习些乊,亁丧亞乶乇乕习乊,亞乓世丘,亮乞也亙丨丩,乒九乬乭乮丙,丐,亥亦专亟亂么丗义丙,亲亐丗买丙,乷乔亚争,丒乔世,丑丒乶专且丕乯乔产乊,亁丧乶乔亱,仑亘乀亯亰丵丶亃亳习些,亞乇乕习,亞乒乓世丘,亞亮乞也亙丨丩,亥亦亞九乬乭乮丙,亞,专亟亂么丗义丙,仒亲乔亐丗买丙,丑乶乷乔亚争,亁丧丒乶乔亄,丒专且丕乯产,乔亱,乒亘乀亯亰丵丶亃亳习些乊,乇乕习乊,亥亦乓世丘,亮乞也亙丨丩,九乬乭乮丙,丐,丑乶专亟亂么丗义丙,亁丧乶亲乔亐丗买丙,乷亚争,丒乔亄,丒乒专且丕乯产乊,亱,亮亦亘乀亯亰丵丶亃亳习些乊,乇乕习乊,乓世丘,亮乞也亙丨丩,丑乶九乬乭乮丙,亁丧乶,专亟亂么丗义,亞亲乔亐丗买丙,亞乒乷亚争,亞丒亄,亥亦亞丒专且丕乯产乊,亞亱,亘乀亯亰丵丶亃亳习些乊,乇乕习乊,丑乶乓世丘,亁丧乶亮乞也亙丨丩,九乬乭乮,丐,乒专亟亂么丗义丙,亲亐丗买丙,亥亦乷亚争,丒亄,丑亞乷乔,丧亞专亟且丕亃亄,亁亞丒么习乊,亞丒亮丵丶亐习乊,亞乶九亘亚些,乒乶乀,亦乇也产丘丙,亥乓乭乮亱丩,乞亲亙亳丗丙,乬专亂乕丗丙,丑乔世争义,丧亯亰乯乔丨买,亁乷乔乊,专亟且丕亃亄,丒乶么习,亞丒乒乶亮丵丶亐习,亦亞九亮亚些,亥亞乀,亞乇也产丘丙,亞乓乭乮亱丩,丑乞亲亙乔亳丗丙,丧乬专亂乔乕丗丙,亁乔世争义,亯亰乯乔丨买,乶乷乔,乒乶专亟且丕亃亄,亦丒么习乊,亥丒亮亂丶亐习乊,九亘亚些,乀,丑仑乇也产丘丙,丧乓乭乮亱丩,亁仒乞亲亙乔亳丗丙,乬专亂乔乕丗丙,乶乔世争义,乒乶亯亰乯丨买,亦乷乊,亥专亟且丕亃亄,丒么习乊,丒亮丵丶亐习乊,丑九亘亚些,丧乀,亁乇也产丘丙,乓乭乮亱丩,乶乞亲亙乔亳丗,亞乒乶乬专亂乕丗丙,亦亞世争义,亥亞亯亰乯丨买,亞乷乊,亞专亟且丕亃亄,丑丒么习乊,丧丒亮亂丶亐习乊,亁九亘亚些,乀,乶乇也产丘,乒乶乓乭乮亱丩,亦乞亲亙亳丗丙,亥乬专亂乕丗丙,世争义,亯亰乯丨买,亞亃争义,亞亮产买,亦亞丒专乷且丕亱习乊,亞丒亳习亄乊,亞乒乶九丵丶乕,乶乀世,亘乇丨些丙,丧乓也亲,丑乞亯亰乭乮丗丘丙,乬乔么丗丩丙,专亟亂乯乔亐,亙乔亚,亦亃争义乊,亮产买,丒乒乶专乷且丕亱习,亞丒乶亳习亄,亞九丵丶乕,丧亞乀世,丑亞亘乇丨些丙,亞乓也亲乔,乞亯亰乭乮乔丗丘丙,乬乔么丗丩丙,亦专亟亂乯乔亐,亙亚,乒乶亃争义,乶亮产买,丒专乷且丕亱习乊,丧丒亳习亄乊,丑九丵丶乕,乀世,仑亘乇丨些丙,乓也亲乔,亦乞亯亰乭乮乔丗丘丙,乬么丗丩丙,乒乶专亟亂乯乔,乶亙亚,亃争义乊,丧亮产买,丑丒专乷且丕亱习乊,丒亳习亄乊,九丵丶乕,乀世,亦亘乇丨些丙,仒乓也亲,乒乶乞亯亰乭乮乔丗丘,亞乶乬么丗丩丙,亞专亟亂乯亐,丧亞亙亚,丑亞亃争义乊,亞亮产买,丒专乷且丕亱习乊,丒亳习亄乊,亦九丵丶乕,乀世,亦乶亘乇丨些,乶乓也亲,乞亯亰乭乮丗丘丙,丧乬么丗丩丙,丑专亟亂乯亐,亙乔亚,亥亦亞丨争,亞,亞丒亙习义乊,亞丒专亟且丕么习买乊,亞乶九乷亐,亁丧乶乀亯亰丵丶亚亄,丑乇亲丙,乒乓产,亘乞也乔亱丗些丙,乬乭乮乯乔亳丗丙,亥亦乔乕丘,亮专亂亃世丩,丨争乊,丐,丒乶亙习义,亁丧亞丒乶专亟且丕么习买,丑亞九乷亐,亞乒乀亯亰丵丶亚亄,亞乇亲乔丙,亞乓乔产,亥亦亘乞也乔亱丗些丙,乬乭乮乯乔亳丗丙,乕丘,亮专亂亃世丩,乶丨争,亁丧乶,丑丒亙习义乊,丒乒专亟且丕么习买乊,九乷亐,乀亯亰丵丶亚亄,亥亦仑乇亲乔丙,乓乔产,亘乞也亱丗些丙,乬乭乮乯亳丗丙,乶乔乕丘,亁丧乶亮专亂亃世丩,丑丨争乊,乒,丒亙习义乊,丒专亟且丕么习买乊,亥亦九乷亐,乀亯亰丵丶亚亄,乇亲丙,乓产,乶亘乞也乔亱丗些,亁丧亞乶乬乭乮乯亳丗丙,丑亞乕丘,亞乒亮专亂亃世丩,亞丨争乊,亞,亥亦丒亙习义乊,丒专亟且丕么习买乊,九乷亐,乀亯亰丵丶亚亄,仒乶乇亲乔,亁丧乶乓产,丑亘乞也亱丗些丙,乒乬乭乮乯亳丗丙,乔乕丘,亮专亂亃世丩,亞丵乬专亟亂亚丘,亞丒丩,丑亞亯亰产争习乊,丧亞亱习乊,亁亞丒专且丕亳义,仒亲亙乕买,乷丵丶世丙,丒丨亄,亦乒乶乀,亥乶亮乇也乔丗丙,丒亘乓乭乮亃么些,乞亐,丑九乬专亟亂亚丘乊,丧丒丩,亁亯亰产争习,亞亱习,亞丒专且丕亳义,亞亲亙乕买,亦亥乒乶乷丵丶乔世丙,亥亞丒乶乔丨亄,乀乯乔丗丙,亮乇也乔丗丙,丑丒亘乓乭乮亃么些,丧乞亐,亁九乬专亟亂亚丘,丒丩,亯亰产习乊,亱习乊,亦丒乒乶专且丕亳义,亥乶亲亙乔乕买,乷丵丶乔世丙,丒乔丨,丑乀乯丗丙,丧亮乇也丗丙,亁丒亘乓乭乮亃么些,乞亐,九乬专亟亂亚丘乊,丒丩,亦乒乶亯亰产争习乊,亥乶亱习乊,丒专且丕亳义,亲亙乔乕买,丑乷丵丶世丙,丧丒丨亄,亁仑乀乯乔,亞亮乇也丗丙,亞丒亘乓乭乮亃么些,亞乞亐,亦亞乒乶九乬专亟亂亚丘乊,亥亞丒乶丩,亯亰产争习乊,亱习乊,丑丒专且丕亳义,丧亲亙乕买,亁乷丵丶乔世,丒丨亄,乀乯丗丙,亮乇也丗丙,亦丒乒乶亘乓乭乮亃么些,亥乶乞亐,丑亞九亘乬世些,丧亞丒专亂丨,亞争习丘乊,亞习丩乊,亞丒亲乔么,专亟且丕亐,亦亚义丙,丒亮丵丶乯乔买,乶乀乷亙乔产丗丙,乒乶乇亃亱丗丗亄丙,丑丒乓也亳,丧乞亯亰乭乮乕,九亘乬世些乊,丒专亂丨,争习丘,亞习丩,亦亞丒仒亲么,亞专亟且丕乔亐,亞乶乔亚义丙,亞丒乒乶亮丵丶乯乔买,丑乀乷亙乔产丗丙,丧乇亃亱丗亄丙,丒乓也亳,乞亯亰乭乮乕,九亘乬世些,丒专亂丨,亦争习丘乊,习丩乊,丒乶亲乔么,乒乶专亟且丕乔亐,丑乔亚义丙,丧丒亘丵丶乯买,乀乷亙产丗丙,乇亃亱丗亄丙,丒乓也亳,乞亯亰乭乮乕,亦九亘乬世些乊,丒专亂丨,乶争习丘乊,乒乶习丩乊,丑丒亲乔么,丧专亟且丕亐,亚义丙,丒亮丵丶乯买,仑乀乷亙乔产丗,亞乇亃亱丗亄丙,亦亞丒乓也亳,亞乞亯亰乭乮乕,亞乶九亘乬世些乊,亞丒乒乶专亂丨,丑争习丘乊,丧习丩乊,丒亲么,专亟且丕亐,乔亚义,丒亮丵丶乯买,亦乀乷亙产丗丙,乇亃亱丗亄丙,丒乶乓也亳,乒乶乞亯亰乭乮乕,亞九乬企乮亐,亞丒亚,亥亦亞亘专亟亂习些乊,亞亲产习乊,亞丒乔亱争丘,亮亳丩,乒专且丕乯乔乕丙,亁丧丒乔世,丑乶乀亯亰丵丶亃丨丗义丙,乶乇丗买丙,丒乓乷,乞也亙么亄,亥亦九乬乭乮亐乊,丒亚,亘专亟亂习些,亞亲产习,亞丒乒乔亱争丘,亁丧亞亮乔亳丩,丑亞乶专且丕乯乔乕丙,亞丒乶乔世,乀亯亰丵丶亃丨丗义丙,乇丗买丙,亥亦丒乓乷,乞也亙么亄,九乬乭乮亐,丒亚,乒亘专亟亂习些乊,亁丧仒亲乔产习乊,丑丒乶乔亱争丘,乶亮乔亳丩,专且丕乯乕丙,丒世,亥亦乀亯亰丵丶亃丨丗义,乇丗买丙,丒乓乷,乞也亙么亄,乒九乬乭乮亐乊,亁丧丒乮,丑乶亘专亟亂习些乊,乶亲乔产习乊,丒亱争丘,亮亳丩,亥亦专且丕乯乕丙,丒世,仑乀亯亰丵丶亃丨丗义,亞乇丗买丙,亞丒亦乓乷,亁丧亞乞也亙么亄,丑亞乶九乬乭乮亐乊,亞丒乶亚,亘专亟亂习些乊,亲产习乊,亥亦丒亱争丘,亮亳丩,专且丕乯乔乕,丒世,乒乀亯亰丵丶亃丨丗义丙,亁丧乇丗买丙,丑丒乶乓乷,乶乞也亙么亄,亦亞仑乶乇乷也乕,亥亞乒乶乓乭乮世亄,亞九乞亲亙丨习乊,亞亮乬专亂习乊,亞亘争些,丧亯亰乯乔么,亁丑乔亐丘丙,专亟且丕亃亚丩,丒丗丙,丒丵丶产丗丙,亦乶亱义,亥亦乶乀亳买,乇乷也乕乊,乓乭乮世亄,九乞亲亙丨习,丧亥亮乬专亂乔习,亁丑亞亘乔争些,亞亯亰乯乔么,亞乔亐丘丙,亞专亟且丕亃亚丩,亦丒乶丗丙,亥丒乒乶丵丶产丗丙,亱义,乀亳买,乇乷也乕,丧丑九乞亲亙乔丨习乊,亁丑九乞亲亙乔丨习乊,亮乬专亂乔习乊,亘乔争些,亯亰乯乔么,亦乶亐丘丙,亥乒乶专亟且丕亃亚丩,丒丗丙,丒丵丶产丗丙,亱义,丧乀亳买,亁丑乇乷也乕乊,乓乭乮世亄,仒九乞亲亙乔丨习乊,亮乬专亂乔习乊,亦乶亘争些,亥乒乶亯亰乯么,亐丘丙,专亟且丕亃亚丩,丒丗,亦亞丒丵丶产丗丙,亁丑亞亱义,亞乀亳买,亞乇乷也乕乊,亞乓乭乮世亄,亦乶九乞亲亙丨习乊,亥乒乶亘乬专亂习乊,亘争些,亯亰乯么,亐丘,丧专亟且丕亃亚丩,亁丑丒价丙,丒丵丶产丗丙,亱义,乀亳买",
  xs: "之乌乖乍乎,仸仹,丷亷乻,亨仈乸乢,亇亍,乡事乃井,云互乱乲亅了丷亸,乹乺亊亓亡,业丛东丝丞,个丫丬中亠丞,丷仂丸丹为,乁乂乃乄,之乌乖乍乎人,仸仹仺,丷亷乻,亨仈亩亴乸乢,亇亍,乡事乃井,云互乱乲亅了丷亸,乹乺亊亓亠人亡,业丛东丝丞,个丫丬中丞,丷丸丹为,乁乂乃乄,之事乖乍乎仪,任仸,丷亷乻,亨仈亩亴乸乢仆,亇仕亍,乡事亠乃井,云互乱乲亅了丷亸,乹乺亊亓亡,业丛东丝丞,个丫丬中丞,丷丸丹为,乁乂乃乄,之乌东乍乎,丐,丷亷乻,亨仈亩亴乸乢亠,亇亍,乡事乃井,云互乱乲亅了二丷亸份,乹乺亊亓五亡,业丛东丝丞,个丫丬中丞,丷丸丹为,乁乂乃乄,之乌乖乍乎亵亶从仼,亠五人,丷仂亷五乻,亨仈亩亴乸乢,亇亍,乡事二乃井,云互乱乲亅了丷亸,乹乺亊亓五亡,业丛东丝丞五,个丫丬中仌仆丞,丷丸丹为,乁乂仍亶亠乃乄,亴乸乂东亷亸为,之乌乖丹乄,乡乢丷,乱乲,个仈乹乺仕乻,亅了亇业丛亠乃,亊丫丬中事丷亍,云互亓丸井,乁丞,仆丝丞亡,亨亩丷仂,乍乎乃,亴乸乂东亷亸人为,之乌乖丹乄,乡乢丷,乱乲亠,个仈乹乺乻,亅了亇业丛乃,亊丫丬中事丷亍,云互亓丸人井,乁丞,丝丞亡,亨亩丷,乍乎乃,亴乸乂东亷亸为亹,之乌乖丹亠乄,乡乢丷,乱乲,个仈乹乺乻,亅了亇业丛乃,亊丫丬中事丷亍,云互亓丸井,乁丞,丝丞亡,亨亩丷,乍乎亠乃,亴乸乂东亷亸为,之乌乖丹乄,乡乢丷,乱乲,个乸乹乺乻,亅了亇业丛乃,亊丫丬中事二丷亍,云互亓丸五井亖,乁丞,丝亠丞亡,亨亩丷,乍乎乃,亴乸乂亵亶东亷亸为亹,之乌乖丹五人乄亻,乡乢丷仂五,乱乲仆,个仈乹乺乻,亅了亇二业丛乃,亊丫丬中事丷亍,云互亓丸亠五井,乁丞五,仌丝丞亡,亨亩丷,乍乎仍亶乃从仏,乱乲亵仗亠,乹乺乂乢丷东亷亸,之乌乖丹为,丫丬中乄,亅了丸业丛,亨仈亩亊乁丷乃,亇仆乻,事,云互丞亍,亴乸丷丞井,乍乎亓丝亠从,个乡仍仗乃亡,乱乲人,乹乺乂乢丷仂东亷亸,之乌乖丹为,丫丬中乄,亅了丸业丛,亨仈亩亊乁丷乃,亇乻,事人,云互亠丞亍,亴乸丷丞井,乍乎亓丝,个乡乃亡,乱乲,乹乺乂乢丷东亷亸,之乌乖丹为,丫丬中,亅了丸业丛,亨仈亩亊乁丷乃,亇亠乻,事仕,云互丞,亴乸丷丞井,乍乎亓丝,个乡乃亡,乱乲仆,乹乺乂乢丷东亷亸,之乌乖丹为,丫丬中乄,亅了丸业丛亠,亨仈亩亊乁丷乃,亇乻,事五,云互丞亍,亴乸丷丞井,乍乎亓丝仏,个乡乃亡,乱乲仌,乹乺乂乢丷东亷亸五人,之乌乖丹亠五为亻,丫丬中乄,亅了丸业丛,亨仈亩亊乁丷仂乃,亇乻,事五,云互二丞五亍,亴乸二丷丞井仾,乍乎亓丝,个乡乃亡,亨亩丫丬中乢亵仗,丷丸业丛亠亡,乁乂亷,之乌乖亅了,亊为,丷东丝丹乃乄,个仈亴乸,亇亸,乡事丞乻,云互乱乲乍乎丷丞,乹乺亓亍,仍仗亠乃井,亨亩丫丬中乢人,丷仂丸业丛亡,乁乂亷,之乌乖亅了仪,亊为,丷东丝丹乃乄,个仈亴乸,亇亸人,乡事丞乻,云互乱乲乍乎丷亠丞乻,乹乺亓亍,乃井,亨亩丫丬中乢,丷丸业丛亡,乁乂亷,之乌乖亅了,亊为,丷东丝丹乃乄,个仈亴乸,亇仕仆亸亠,乡事丞乻,云互乱乲乍乎丷丞,乹乺亓亍,乃井,亨亩丫丬中乢,丷丸业丛亡,乁乂亷,之乌乖亅了,亊为,丷东丝丹亠乃乄,个仈亴乸,亇亸五,乡事丞乻,云互乱乲乍乎丷丞仜,乹乺亓亍,乃井,亨亩丫丬中乢仌,丷丸业丛仆五人亡,乁乂亷,之乌乖亅了亠亻,亊为,丷仂东丝丹乃乄,个仈亴乸,亇亸五,乡事二丞五乻,云互乱乲乍乎二丷丞仏,乹乺亓亍,乃井,亵仗仆亷亍,个丷井,亅了亸,亊亴乸乂亡,之乌乖亩仕亠仪伇,乡丷乃,乱乲丝为,亨仈乹乄,乍乎亇丹丞仠,丫丬中事丷东丞,云互亓丸业丛乻,乁乢仍仗乃,亷人亍,个丷仂井,亅了亸亠,亊亴乸乂亡,之乌乖亩仡,乡丷乃,乱乲仆丝为,亨仈乹乺人乄,乍乎亇丹丞代,丫丬中事丷东丞,云互亓丸业丛乻,乁乢乃,亷亠亍,个丷井,亅了亸,亊亴乸乂亡,之乌乖亩,乡丷乃,乱乲丝为,亨仈乹乺乄,乍乎亇丹丞令,丫丬中事丷东丞,云互亓丸业丛亠乻,乁乢乃,亷亍,个丷井,亅了亸,亊亴乸乂亡,之乌乖亩亻,乡丷乃,乱乲丝为,亨仈乹乺五乄,乍乎亇丹亠丞仠,丫丬中事丷东丞,云互亓丸业丛乻,乁乢乃,仌亷亍,个丷五人井,亅了亸五,亊亴乸乂亡,之乌乖亩,乡丷仂乃,乱乲丝亠为,亨仈乹乺五乄,乍乎亇二丹丞五仠仏,丫丬中事二丷东丞,云互亓丸业丛乻,乁乢乃,亴乸丷乻,亅了亓亷,亨乡亊东亠亍,乱乲井,乹乺乂丷仩,之乌乖乃亡仪仫亻,丫丬中,乍乎丸业丛丝仠,个仈亩乁丷亸丞为,亇丞乄,事乢,云互丹乃,亴乸亵仭丷亠人乻,亅了亓亷,亨乡亊东亍,乱乲仆井,乹乺乂丷,之乌乖乃亡,丫丬中,乍乎丸业丛丝人仠,个仈亩乁丷仂亸丞为,亇丞乄,事乢仕亠,云互仍仭丹乃,亴乸丷乻,亅了亓亷,亨乡亊东亍,乱乲井,乹乺乂丷,之乌乖乃亡,丫丬中,乍乎丸业丛丝代,个仈亩乁丷亸亠丞为,亇丞乄,事乢,云互丹乃,亴乸丷乻,亅了亓亷,亨乡亊东亍,乱乲井,乹乺乂丷仂,之乌乖乃亡,丫丬中亠仧,乍乎丸业丛丝五令仏,个仈亩乁丷亸丞为,亇仆丞乄,事乢,云互丹乃,亴乸二丷乻,亅了亓亷五人,亨乡亊东五亍,乱乲仌井,乹乺乂丷亠,之乌乖乃亡亻,丫丬中仧,乍乎丸业丛丝五仠仏,个仈亩乁丷亸丞五为,亇丞乄,事乢,云互二丹乃仨,云互乱乲亅了丷,乹乺亊亓,丝亷乻,个丫丬中业丛亸丹亠,丷丸亍,乁乂乃井,之乌乖亩乍乎东,亡,丷丞,亨仈亴乸乢丞,亇为,乡事乃乄,云互乱乲亅了亵仭丷人,乹乺亊亠,丝亷乻,个丫丬中业丛亸丹,丷丸亍,乁乂乃井,之乌乖亩乍乎东,人亡,丷仂丞,亨仈亴乸乢丞,亇仕为,乡事仍仭亠乃乄,云互乱乲亅了丷,乹乺亊亓,丝亷乻,个丫丬中业丛亸丹,丷丸亍,乁乂乃井,之乌乖亩乍乎东,亡,丷丞,亨仈亴乸乢亠丞,亇为,乡事乃乄,云互乱乲亅了丷,乹乺亊亓,丝亷乻,个丫丬中业丛亸丹,丷仂丸仆亍,乁乂乃井,之乌乖亩乍乎东从仼,亠五亡,丷丞,亨仈亴乸乢丞,亇为,乡事乃乄,云互乱乲亅了二丷份,乹乺亊亓五人,丝亷五乻,个丫丬中仌业丛亸丹,丷丸亍,乁乂亠乃井,之乌乖亩乍乎东仪,五亡,丷丞五,亨仈亴乸乢丞,亇仆为,乡事二乃乄,亊丫丬中事丷业丛亷为,云互亩亓丸乄,乁,丝,亨丷仕乻,乍乎亠乃仏,亴乸乂丹亍,之乌乖井,乡乢丷丞,乡乢丷丞,个仈乹乺东,亅了亇乃,亊丫丬中事亵仭丷业丛亷人为,云互亩亓丸乄,乁,丝亠,亨丷乻,乍乎乃,亴乸乂丹亍,之乌乖人井,乡乢丷仂丞,乱乲亸丞亡,个仈乹乺东仆,亅了亇仍仭乃,亊丫丬中事丷业丛亷为,云互亩亓丸亠乄,乁,丝,亨丷乻,乍乎乃,亴乸乂丹亍,之乌乖井,乡乢丷丞,乱乲亸丞亡,个仈乹乺东,亅了亇亠乃,亊丫丬中事丷业丛亷为,云互亩亓丸乄,乁,丝,亨丷仂乻,乍乎乃,亴乸乂丹亍亹,之乌乖五井亻,乡乢丷丞,乱乲亸亠丞亡,个仈乹乺东,亅了亇乃,亊丫丬中事二丷业丛亷为,云互亩亓丸五人乄仯,乁五,仌丝,亨丷仆乻,乍乎乃从仏,亴乸乂丹亍亹,之乌乖亠五井亻,乡乢丷丞五,乱乲亸丞亡,个仈乹乺东,亅了亇二乃,亇,事亷,云互亩为,亴乸乄丷伄,乍乎亓丝亸,个乡乃,乱乲亠乻,乹乺乂乢丷,之乌东丞亍,丫丬中业丛丹丞井,亅了仲丸,亨仈亊乁乃亡,亇人,事亷,云互亩,亴乸丷东乄,乍乎亓丝亸亠从,个乡乃,乱乲乻,乹乺乂乢丷人,之乌乖丞亍,丫丬中业丛丹丞井,亅了仲丸,亨仈亊乁丷仂仆乃亡,亇,事亷,云互亩亠为,亴乸丷东乄,乍乎亓丝亸,个乡乃,乱乲乻,乹乺乂乢丷,之乌乖丞亍,丫丬中业丛丹丞井,亅了仲丸,亨仈亊乁丷乃亡,亇亵仴亠,事仕亷,云互亩为,亴乸丷东乄,乍乎亓丝亸仏,个乡乃,乱乲乻,乹乺乂乢丷仂五,之乌乖丞亍,丫丬中业丛丹丞井,亅了仲丸亠,亨仈亊乁仍仴丷乃亡,亇,事亷五人,云互亩二五为,亴乸二丷东乄仾,乍乎亓丝亸,个乡仆乃,仌乻,乹乺乂乢丷五,之乌乖亠丞五亍亻,丫丬中业丛丹丞井,亅了仲丸,亨仈亊乁丷乃亡,个仈亴乸丹,亇亡,乡事仆亷,云互乱乲乍乎丷,乹乺亓为,仵乄,亨丫丬中乢业丛,丷丸东亠,乁乂丞乻,之乌乖亩亅了丞,亊亸亍,丷丝乃井,个仈亴乸丹人,亇亡,乡事亷,云互乱乲乍乎丷仜,乹乺亓为,亠乃乄,亨丫丬中乢业丛,丷丸东人,乁乂丞乻,之乌乖亩亅了丞,亊亸亍,丷仂丝乃井,个仈亴乸丹,亇亡,乡事亷,云互乱乲乍乎丷亠从,乹乺亓为,乃乄,亨丫丬中乢业丛,丷丸东,乁乂仆丞乻,之乌乖亩亅了丞,亊亸亍,丷丝乃井,个仈亴乸亵仴丹,亇仕亠亡,乡事亷,云互乱乲乍乎丷,乹乺亓为,乃乄,亨丫丬中乢业丛,丷仂丸东五,乁乂丞乻,之乌乖乍亅了丞仪,亊亸亍,仍仴丷丝亠乃井,个仈亴乸丹,亇五人亡,乡事二亷五,云互乱乲乍乎二丷仏,乹乺亓为,乃乄,亨丫丬中乢仌业丛,丷丸东五,乁乂丞五乻,之乌乖亩亅了亠丞亻,亊亸亍,丷丝乃井,乱乲丝亷亍,亨仈乹乺井,乍乎亇业丛仠,丫丬中事丷亡,云互亓仕丸丹亠,乁乢亸乃,为,个亩丷仆乄,亅了丞,亊亴乸乂丞,之乌乖乻仡,乡丷东乃,乱乲丝亷人亍,亨仈乹乺井,乍乎亇业丛亠仠,丫丬中事丷亡,云互亓丸丹,乁乢亸乃,为,个亩丷人乄,亅了丞,亊亴乸乂丞,之乌乖乻,乡丷仂东乃,乱乲丝亷亠亍,亨仈乹乺井,乍乎亇业丛代,丫丬中事丷亡,云互亓丸丹,乁乢亸乃,为,个亩丷乄,亅了丞,亊亴乸乂丞,之乌乖亠乻仪件,乡丷东乃,乱乲亵仴丝亷亍,亨仈乹乺仆井,乍乎亇业丛令,丫丬中事丷亡,云互亓丸丹,乁乢亸乃,为,个亩丷仂五乄,亅了亠丞,亊亴乸乂丞,之乌乖乻亻,乡仍仴丷东乃,乱乲丝亷亍,亨仈乹乺五人井,乍乎亇二业丛五仠仏,丫丬中事二丷亡,云互亓丸丹,乁乢亸乃,仌亠为,个亩丷五乄,亅了丞五,亊亴乸乂丞,之乌乖乻,乡丷东乃,丫丬中乻,乍乎丸丝亷仠,个仈乁丷亍,亇井,事乢东,云互乃亡,亴乸丷,亅了亓丹,亨乡亊亠丞为,乱乲丞乄,乹乺乂丷仂,之乌乖亩业丛乂乃,丫丬中人乻,乍乎丸丝亷仠,个仈乁丷仆亍,亇井,事乢东,云互乃亡,亴乸丷亠,亅了亓丹人,亨乡亊丞为,乱乲丞乄,乹乺乂丷,之乌乖亩业丛亸乃,丫丬中乻仧,个仈乁丷亍,个仈乁丷亍,亇井,事乢仕东亠,云互乃亡,亴乸丷,亅了亓丹,亨乡亊丞为,乱乲丞乄,乹乺乂丷伅,之乌乖亩业丛亸乃仪伆,丫丬中乻,乍乎丸丝亷代,个仈乁丷亠亍,亇井,事乢东,云互乃亡,亴乸二丷,亅了亓丹五,亨乡亊仆丞为,乱乲丞乄,乹乺乂丷,之乌乖亩业丛亸乃,丫丬中亵亶亠乻仧,乍乎丸丝亷五人令仏,个仈乁丷仂五亍,亇井,事乢东,云互二乃亡仨,亴乸丷,亅了亓丹五,亨乡亊丞五为,乱乲仌丞乄,乹乺乂丷亠,之乌乖亩仍亶业丛亸乃亻",
};
let ZR = null;
function zrInit() {
  if (ZR) return;
  const it = ZERI_DATA.items.split(" ");
  const dec = (s) => [...s].map((c) => it[c.charCodeAt(0) - 0x4e00]).filter((x) => x && x !== "无");
  const P = (f) => ZERI_DATA[f].split(",").map(dec);
  ZR = { yi: P("yi"), ji: P("ji"), js: P("js"), xs: P("xs") };
}
function tianshenStart(mz) {
  // 月支→青龙所在日支:寅申月子,卯酉月寅,辰戌月辰,巳亥月午,子午月申,丑未月戌
  return { 2: 0, 8: 0, 3: 2, 9: 2, 4: 4, 10: 4, 5: 6, 11: 6, 0: 8, 6: 8, 1: 10, 7: 10 }[mz];
}
/* 某公历日(按北京时间日期)的黄历信息 */
function dayInfo(y, m, d) {
  zrInit();
  const jdNoon = jdFromGreg(y, m, d, 12);
  const dn = Math.floor(jdNoon + 0.5 + 1e-9);
  const dayIdx = (((dn + 49) % 60) + 60) % 60,
    dz = dayIdx % 12,
    dg = dayIdx % 10;
  // 月支(日粒度):取当日 23:59 的太阳黄经所在节令
  const lonEnd = sunLon(jdFromGreg(y, m, d, 23, 59, 0) - 8 / 24);
  const mi = Math.floor(((((lonEnd - 315) % 360) + 360) % 360) / 30),
    mz = (2 + mi) % 12;
  const zx = JCHU[(dz - mz + 12) % 12];
  const xiu = XIU28[(((dn + XIU_ANCHOR) % 28) + 28) % 28];
  const ts = TIANSHEN[(((dz - tianshenStart(mz)) % 12) + 12) % 12];
  const huang = TS_HUANG.includes(ts);
  const key = mz * 60 + dayIdx;
  const chong = (dz + 6) % 12;
  const grp = [
    [8, 0, 4],
    [2, 6, 10],
    [5, 9, 1],
    [11, 3, 7],
  ].findIndex((g) => g.includes(dz));
  const shaDir = { 0: "南", 1: "北", 2: "东", 3: "西" }[grp]; // 申子辰→南 寅午戌→北 巳酉丑→东 亥卯未→西
  const lunar = solar2lunar(y, m, d);
  return {
    y,
    m,
    d,
    dayIdx,
    gz: gz(dayIdx),
    mz,
    zx,
    zxTone: JCHU_TONE[zx],
    xiu,
    xiuTone: XIU_TONE[XIU28.indexOf(xiu)],
    ts,
    huang,
    chong: ZODIAC[chong],
    chongZ: chong,
    sha: shaDir,
    yi: ZR.yi[key],
    ji: ZR.ji[key],
    js: ZR.js[key],
    xs: ZR.xs[key],
    lunar,
    nayin: NAYIN[dayIdx >> 1],
    week: (dn + 1) % 7,
  };
}
/* 择日事项:关键词(取自历书宜忌条目) */
const ZERI_EVENTS = {
  嫁娶: { yi: ["嫁娶", "纳采", "订盟", "问名"], ji: ["嫁娶"], avoidZ: "chong", desc: "婚嫁、订婚" },
  开业: {
    yi: ["开市", "交易", "立券", "纳财", "挂匾"],
    ji: ["开市", "交易", "立券"],
    avoidZ: "chong",
    desc: "开张、签约、挂牌",
  },
  搬家: { yi: ["移徙", "入宅", "安床"], ji: ["移徙", "入宅"], avoidZ: "chong", desc: "乔迁、入宅" },
  动土: {
    yi: ["动土", "破土", "修造", "上梁", "起基", "竖柱"],
    ji: ["动土", "破土", "修造"],
    avoidZ: "",
    desc: "装修、动工、修造",
  },
  出行: { yi: ["出行"], ji: ["出行"], avoidZ: "chong", desc: "远行、赴任" },
  祈福: {
    yi: ["祈福", "祭祀", "斋醮", "求嗣", "酬神"],
    ji: ["祈福", "祭祀"],
    avoidZ: "",
    desc: "祭祀、还愿、祈福",
  },
  求医: {
    yi: ["求医", "治病", "针灸", "经络"],
    ji: ["求医", "治病"],
    avoidZ: "",
    desc: "就医、手术、调理",
  },
  入学: { yi: ["入学", "习艺", "冠笄"], ji: ["入学"], avoidZ: "", desc: "入学、拜师、学艺" },
  安葬: {
    yi: ["安葬", "破土", "入殓", "启钻", "谢土"],
    ji: ["安葬", "破土", "入殓"],
    avoidZ: "",
    desc: "殡葬相关",
  },
  签约: {
    yi: ["立券", "交易", "订盟", "纳财"],
    ji: ["立券", "交易"],
    avoidZ: "chong",
    desc: "合同、交易",
  },
  看房: {
    yi: ["交易", "立券", "纳财", "移徙", "会亲友", "出行"],
    ji: ["立券", "交易"],
    avoidZ: "chong",
    desc: "看房选址、踏勘签约",
  },
  办公: {
    yi: ["开市", "交易", "立券", "纳财", "移徙"],
    ji: ["开市", "移徙"],
    avoidZ: "chong",
    desc: "新办公室启用、开工办公",
  },
  职场: {
    yi: ["赴任", "出行", "会亲友", "纳财", "立券"],
    ji: ["赴任"],
    avoidZ: "chong",
    desc: "入职、面试、赴任",
  },
  事业: {
    yi: ["开市", "交易", "立券", "纳财", "赴任", "会亲友"],
    ji: ["开市", "赴任"],
    avoidZ: "chong",
    desc: "创业、升迁、重大事业决定",
  },
};
function scoreDay(info, evName, birthZ) {
  const ev = ZERI_EVENTS[evName];
  let sc = 0;
  const why = [];
  const flags = {};
  const hit = ev.yi.filter((x) => info.yi.includes(x)),
    bad = ev.ji.filter((x) => info.ji.includes(x));
  if (hit.length) {
    sc += Math.min(3, hit.length) * 1.2;
    why.push("宜:" + hit.join("、"));
  }
  if (bad.length) {
    sc -= 3.5;
    why.push("忌:" + bad.join("、"));
    flags.ji = 1;
  }
  sc += info.huang ? 1 : -1;
  why.push(info.ts + (info.huang ? "(黄道)" : "(黑道)"));
  sc += { 吉: 1, 平: 0, 凶: -1.5 }[info.zxTone];
  why.push(info.zx + "日");
  if (info.zx === "破") {
    sc -= 2;
    why.push("月破");
    flags.po = 1;
  }
  if (info.xiuTone > 0) sc += 0.4;
  else sc -= 0.4;
  if (birthZ != null && birthZ >= 0) {
    if (info.chongZ === birthZ) {
      sc -= 3;
      why.push("冲本命生肖(" + ZODIAC[birthZ] + ")");
      flags.chong = 1;
    } else;
    if (
      Z_HE6.some(
        ([a, b]) =>
          (a === birthZ && b === info.dayIdx % 12) || (b === birthZ && a === info.dayIdx % 12),
      )
    ) {
      sc += 0.8;
      why.push("日支合本命");
    }
  }
  if (
    info.js.some((x) =>
      [
        "天德",
        "月德",
        "天德合",
        "月德合",
        "天恩",
        "天赦",
        "天愿",
        "母仓",
        "时德",
        "王日",
        "守日",
        "相日",
        "民日",
      ].includes(x),
    )
  )
    sc += 0.8;
  if (
    info.xs.some((x) =>
      [
        "月破",
        "大耗",
        "四废",
        "天贼",
        "五虚",
        "九空",
        "往亡",
        "归忌",
        "血忌",
        "四离",
        "四绝",
      ].includes(x),
    )
  )
    sc -= 0.8;
  return { sc, why, flags };
}
function zeriRange(y, m, d, days, evName, birthZ) {
  const out = [];
  let jd = jdFromGreg(y, m, d, 12);
  for (let i = 0; i < days; i++) {
    const f = fromJD(jd + i);
    const info = dayInfo(f.y, f.m, f.d);
    const r = scoreDay(info, evName, birthZ);
    out.push({ info, sc: r.sc, why: r.why, flags: r.flags });
  }
  return out;
}

/* 分档:按该事项(含当事人生肖)在 4 年基准期内的分位数分档,避免绝对阈值造成大片“忌”;再叠加硬性限制 */
const ZQ_CACHE = {};
function zrQuant(ev, birthZ) {
  const k = ev + "|" + birthZ;
  if (ZQ_CACHE[k]) return ZQ_CACHE[k];
  const arr = zeriRange(2024, 1, 1, 1461, ev, birthZ)
    .map((x) => x.sc)
    .sort((a, b) => a - b);
  const at = (p) => arr[Math.min(arr.length - 1, Math.floor(p * arr.length))];
  return (ZQ_CACHE[k] = { q15: at(0.15), q40: at(0.4), q70: at(0.7), q90: at(0.9) });
}
function zrTierOf(x, ev, birthZ) {
  const q = zrQuant(ev, birthZ);
  let t = x.sc >= q.q90 ? 4 : x.sc >= q.q70 ? 3 : x.sc >= q.q40 ? 2 : x.sc >= q.q15 ? 1 : 0;
  if (x.flags.ji && t > 1) t = 1; // 该事项在历书中明确为“忌”,至多为“慎”
  if (x.flags.chong && t > 1) t = 1; // 冲本命生肖,至多为“慎”
  if (x.flags.po && t > 0) t = Math.min(t, 1);
  return t;
}

/* =====================================================================
   天象与传统宇宙观:行星位置 · 月相 · 上升/中天 · 星座相位 · 二十八宿 · 五运六气 · 子午流注 · 生肖 · 六十甲子
   行星:JPL “Approximate Positions of the Planets”(1800–2050)开普勒根数,精度约 0.01°–0.5°,用于示意,不用于精密历算。
   月球:Meeus 主要周期项,约 0.1–0.3°。太阳:沿用本页已与天文历库对拍的视黄经。
   ===================================================================== */
const AS_EL = {
  // a,e,I,L,ϖ,Ω  及每世纪变率
  水星: [
    0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.2503235,
    149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081,
  ],
  金星: [
    0.72333566, 0.0000039, 0.00677672, -0.00004107, 3.39467605, -0.0007889, 181.9790995,
    58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418,
  ],
  地球: [
    1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166,
    35999.37244981, 102.93768193, 0.32327364, 0, 0,
  ],
  火星: [
    1.52371034, 0.00001847, 0.0933941, 0.00007882, 1.84969142, -0.00813131, -4.55343205,
    19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343,
  ],
  木星: [
    5.202887, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051,
    3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106,
  ],
  土星: [
    9.53667594, -0.0012506, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423,
    1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794,
  ],
  天王星: [
    19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451,
    428.48202785, 170.9542763, 0.40805281, 74.01692503, 0.04240589,
  ],
  海王星: [
    30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969,
    218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664,
  ],
  冥王星: [
    39.48211675, -0.00031596, 0.2488273, 0.0000517, 17.14001206, 0.00004818, 238.92903833,
    145.20780515, 224.06891629, -0.04062942, 110.30393684, -0.01183482,
  ],
};
const AS_INFO = {
  太阳: { g: "☉", wx: 1, zh: "日" },
  月亮: { g: "☽", wx: 4, zh: "月" },
  水星: { g: "☿", wx: 4, zh: "辰星" },
  金星: { g: "♀", wx: 3, zh: "太白" },
  火星: { g: "♂", wx: 1, zh: "荧惑" },
  木星: { g: "♃", wx: 0, zh: "岁星" },
  土星: { g: "♄", wx: 2, zh: "镇星" },
  天王星: { g: "♅", wx: 0, zh: "天王" },
  海王星: { g: "♆", wx: 4, zh: "海王" },
  冥王星: { g: "♇", wx: 2, zh: "冥王" },
};
const AS_SIGN = [
  ["白羊", "♈", "降娄", "火"],
  ["金牛", "♉", "大梁", "土"],
  ["双子", "♊", "实沈", "风"],
  ["巨蟹", "♋", "鹑首", "水"],
  ["狮子", "♌", "鹑火", "火"],
  ["处女", "♍", "鹑尾", "土"],
  ["天秤", "♎", "寿星", "风"],
  ["天蝎", "♏", "大火", "水"],
  ["射手", "♐", "析木", "火"],
  ["摩羯", "♑", "星纪", "土"],
  ["水瓶", "♒", "玄枵", "风"],
  ["双鱼", "♓", "娵訾", "水"],
];
const D2R = Math.PI / 180,
  norm360 = (x) => ((x % 360) + 360) % 360;
function asKepler(M, e) {
  let E = M + e * Math.sin(M) * (1 + e * Math.cos(M));
  for (let i = 0; i < 8; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-10) break;
  }
  return E;
}
function asHelio(name, T) {
  // 日心黄道直角坐标(J2000 黄道,AU)
  const el = AS_EL[name];
  const a = el[0] + el[1] * T,
    e = el[2] + el[3] * T,
    I = (el[4] + el[5] * T) * D2R,
    L = el[6] + el[7] * T,
    w = el[8] + el[9] * T,
    Om = (el[10] + el[11] * T) * D2R;
  const om = w * D2R - Om;
  let M = ((L - w) % 360) * D2R;
  M = ((((M + Math.PI) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)) - Math.PI;
  const E = asKepler(M, e),
    xp = a * (Math.cos(E) - e),
    yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const c = Math.cos,
    s = Math.sin;
  const x =
    (c(om) * c(Om) - s(om) * s(Om) * c(I)) * xp + (-s(om) * c(Om) - c(om) * s(Om) * c(I)) * yp;
  const y =
    (c(om) * s(Om) + s(om) * c(Om) * c(I)) * xp + (-s(om) * s(Om) + c(om) * c(Om) * c(I)) * yp;
  const z = s(om) * s(I) * xp + c(om) * s(I) * yp;
  return { x, y, z };
}
function asGeoLon(name, T) {
  const p = asHelio(name, T),
    e = asHelio("地球", T);
  const dx = p.x - e.x,
    dy = p.y - e.y,
    dz = p.z - e.z;
  const lon = norm360(Math.atan2(dy, dx) / D2R + 1.3969713 * T); // 岁差至“当日”黄道
  return { lon, lat: Math.atan2(dz, Math.hypot(dx, dy)) / D2R, dist: Math.hypot(dx, dy, dz) };
}
function asMoonLon(T) {
  const Lp = 218.3164477 + 481267.88123421 * T,
    D = 297.8501921 + 445267.1114034 * T,
    M = 357.5291092 + 35999.0502909 * T,
    Mp = 134.9633964 + 477198.8675055 * T,
    F = 93.272095 + 483202.0175233 * T;
  const r = (x) => Math.sin(x * D2R);
  let l =
    Lp +
    6.288774 * r(Mp) +
    1.274027 * r(2 * D - Mp) +
    0.658314 * r(2 * D) +
    0.213618 * r(2 * Mp) -
    0.185116 * r(M) -
    0.114332 * r(2 * F) +
    0.058793 * r(2 * D - 2 * Mp) +
    0.057066 * r(2 * D - M - Mp) +
    0.053322 * r(2 * D + Mp) +
    0.045758 * r(2 * D - M) -
    0.040923 * r(M - Mp) -
    0.03472 * r(D) -
    0.030383 * r(M + Mp) +
    0.015327 * r(2 * D - 2 * F) -
    0.012528 * r(Mp + 2 * F) +
    0.01098 * r(Mp - 2 * F) +
    0.010675 * r(4 * D - Mp) +
    0.010034 * r(3 * Mp) +
    0.008548 * r(4 * D - 2 * Mp) -
    0.007888 * r(2 * D + M - Mp) -
    0.006766 * r(2 * D + M) -
    0.005163 * r(D - Mp) +
    0.004987 * r(D + M) +
    0.004036 * r(2 * D - M + Mp) +
    0.003994 * r(2 * Mp + 2 * D) +
    0.003861 * r(4 * D) +
    0.003665 * r(2 * D - 3 * Mp);
  return norm360(l);
}
function asPlanets(jdUT) {
  const T = (jdUT - 2451545) / 36525,
    out = [];
  const sun = sunLon(jdUT),
    sunN = sunLon(jdUT + 0.5),
    sunP = sunLon(jdUT - 0.5);
  const d = (a, b) => ((a - b + 540) % 360) - 180;
  out.push({ n: "太阳", lon: sun, speed: d(sunN, sunP), retro: false, lat: 0, dist: 1 });
  const mp = asMoonLon(T),
    mn = asMoonLon(T + 0.5 / 36525),
    mm = asMoonLon(T - 0.5 / 36525);
  out.push({ n: "月亮", lon: mp, speed: d(mn, mm), retro: false, lat: 0, dist: 0 });
  ["水星", "金星", "火星", "木星", "土星", "天王星", "海王星", "冥王星"].forEach((n) => {
    const g = asGeoLon(n, T),
      gn = asGeoLon(n, T + 0.5 / 36525),
      gp = asGeoLon(n, T - 0.5 / 36525),
      sp = d(gn.lon, gp.lon);
    out.push({ n, lon: g.lon, speed: sp, retro: sp < 0, lat: g.lat, dist: g.dist });
  });
  out.forEach((p) => {
    const i = Math.floor(p.lon / 30);
    p.sign = AS_SIGN[i];
    p.deg = p.lon - i * 30;
    p.g = AS_INFO[p.n].g;
    p.wx = AS_INFO[p.n].wx;
    p.zh = AS_INFO[p.n].zh;
  });
  return out;
}
function asHelioAll(jdUT) {
  // 太阳系俯视图用:日心黄经与距离
  const T = (jdUT - 2451545) / 36525;
  return ["水星", "金星", "地球", "火星", "木星", "土星", "天王星", "海王星", "冥王星"].map((n) => {
    const h = asHelio(n, T);
    return { n, lon: norm360(Math.atan2(h.y, h.x) / D2R), r: Math.hypot(h.x, h.y) };
  });
}
function asMoonPhase(sunLon_, moonLon_) {
  const el = norm360(moonLon_ - sunLon_),
    age = (el / 360) * 29.530589;
  const names = ["朔(新月)", "蛾眉月", "上弦月", "盈凸月", "望(满月)", "亏凸月", "下弦月", "残月"];
  const idx = Math.floor(((el + 22.5) % 360) / 45);
  const lit = (1 - Math.cos(el * D2R)) / 2;
  return { el, age, name: names[idx], lit, idx };
}
/* 上升与中天(等宫制宫位) */
function asAngles(jdUT, lonE, latN) {
  const T = (jdUT - 2451545) / 36525;
  let gmst = 280.46061837 + 360.98564736629 * (jdUT - 2451545) + 0.000387933 * T * T;
  const lst = norm360(gmst + lonE) * D2R;
  const eps = (23.439291 - 0.0130042 * T) * D2R,
    phi = latN * D2R;
  const mc = norm360(Math.atan2(Math.sin(lst), Math.cos(lst) * Math.cos(eps)) / D2R);
  let asc = norm360(
    Math.atan2(Math.cos(lst), -(Math.sin(lst) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) /
      D2R,
  );
  // 上升点应在中天点之后 0–180° 内
  if (norm360(asc - mc) > 180) asc = norm360(asc + 180);
  const houses = [];
  for (let i = 0; i < 12; i++) houses.push(norm360(asc + 30 * i));
  return { asc, mc, houses, lst: norm360(gmst + lonE) };
}
const AS_ASP = [
  ["合相", 0, 8, "合", "☌"],
  ["六分相", 60, 5, "和", "⚹"],
  ["四分相", 90, 6, "冲", "□"],
  ["三分相", 120, 6, "和", "△"],
  ["对冲", 180, 8, "冲", "☍"],
];
function asAspects(list) {
  const out = [];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i],
        b = list[j];
      let d = Math.abs(a.lon - b.lon);
      if (d > 180) d = 360 - d;
      for (const [n, ang, orb, t, sym] of AS_ASP) {
        const o =
          orb + (a.n === "太阳" || a.n === "月亮" || b.n === "太阳" || b.n === "月亮" ? 2 : 0);
        if (Math.abs(d - ang) <= o) {
          out.push({ a: a.n, b: b.n, i, j, name: n, angle: ang, t, sym, orb: Math.abs(d - ang) });
          break;
        }
      }
    }
  return out;
}
/* 二十八宿:古度距度(赤道度)示意,以角宿一(室女座 α,黄经约 203.84°@J2000)为起点 */
const XIU_DEG = [
  12, 9, 15, 5, 5, 18, 11, 26, 8, 12, 10, 17, 16, 9, 16, 12, 14, 11, 16, 2, 9, 33, 4, 15, 7, 18, 18,
  17,
];
const XIU_NAME = [
  "角",
  "亢",
  "氐",
  "房",
  "心",
  "尾",
  "箕",
  "斗",
  "牛",
  "女",
  "虚",
  "危",
  "室",
  "壁",
  "奎",
  "娄",
  "胃",
  "昴",
  "毕",
  "觜",
  "参",
  "井",
  "鬼",
  "柳",
  "星",
  "张",
  "翼",
  "轸",
];
const XIU_SI = [
  "东方青龙",
  "东方青龙",
  "东方青龙",
  "东方青龙",
  "东方青龙",
  "东方青龙",
  "东方青龙",
  "北方玄武",
  "北方玄武",
  "北方玄武",
  "北方玄武",
  "北方玄武",
  "北方玄武",
  "北方玄武",
  "西方白虎",
  "西方白虎",
  "西方白虎",
  "西方白虎",
  "西方白虎",
  "西方白虎",
  "西方白虎",
  "南方朱雀",
  "南方朱雀",
  "南方朱雀",
  "南方朱雀",
  "南方朱雀",
  "南方朱雀",
  "南方朱雀",
];
const XIU_SIWX = [
  0, 0, 0, 0, 0, 0, 0, 4, 4, 4, 4, 4, 4, 4, 3, 3, 3, 3, 3, 3, 3, 1, 1, 1, 1, 1, 1, 1,
];
const XIU_FULL = XIU28; // 日值宿的全名(来自择日模块)
function xiuStart(year) {
  return norm360(203.84 + 0.013969 * (year - 2000));
}
function xiuTable(year) {
  const st = xiuStart(year),
    tot = XIU_DEG.reduce((a, b) => a + b, 0),
    k = 360 / tot;
  let acc = 0;
  return XIU_DEG.map((d, i) => {
    const s = norm360(st + acc * k);
    acc += d;
    return {
      i,
      n: XIU_NAME[i],
      full: XIU_FULL[i],
      s,
      w: d * k,
      e: norm360(st + acc * k),
      si: XIU_SI[i],
      wx: XIU_SIWX[i],
    };
  });
}
function xiuOf(lon, year) {
  const tb = xiuTable(year);
  for (const x of tb) {
    const d = norm360(lon - x.s);
    if (d < x.w) return { ...x, off: d };
  }
  return { ...tb[0], off: 0 };
}
/* 五运六气(以立春为年界的干支年) */
const WY_YUN = [
  [0, "土"],
  [1, "金"],
  [2, "水"],
  [3, "木"],
  [4, "火"],
]; // 甲己土 乙庚金 丙辛水 丁壬木 戊癸火(下标为 stem%5)
const WY_FIVE = ["木", "火", "土", "金", "水"];
const LQ_ORDER = ["厥阴风木", "少阴君火", "太阴湿土", "少阳相火", "阳明燥金", "太阳寒水"];
const LQ_ZHU = ["厥阴风木", "少阴君火", "少阳相火", "太阴湿土", "阳明燥金", "太阳寒水"];
const LQ_SITIAN = [1, 2, 3, 4, 5, 0, 1, 2, 3, 4, 5, 0]; // 年支(子=0) → LQ_ORDER 下标: 子午少阴 丑未太阴 寅申少阳 卯酉阳明 辰戌太阳 巳亥厥阴
const LQ_SITIAN_FIX = (b) =>
  ({ 0: 1, 6: 1, 1: 2, 7: 2, 2: 3, 8: 3, 3: 4, 9: 4, 4: 5, 10: 5, 5: 0, 11: 0 })[b];
const LQ_START_LON = [300, 0, 60, 120, 180, 240]; // 六步起点(大寒、春分、小满、大暑、秋分、小雪)
const LQ_TERMS = ["大寒—春分", "春分—小满", "小满—大暑", "大暑—秋分", "秋分—小雪", "小雪—大寒"];
const LQ_TIP = {
  厥阴风木: "风木主令:多风,气候变化快;肝气易亢,宜疏肝、舒缓情绪,防头晕头痛、肢体拘急",
  少阴君火: "君火主令:热象明显;心火易动,宜清心安神,防心烦失眠、口舌生疮",
  太阴湿土: "湿土主令:多雨湿重;脾胃易受困,宜健脾化湿,防腹胀、关节沉重",
  少阳相火: "相火主令:炎热易躁;宜养阴清热,防热病、皮肤炎症与情绪急躁",
  阳明燥金: "燥金主令:天气干燥;肺与皮肤易受燥,宜润肺生津,防咳嗽、便秘",
  太阳寒水: "寒水主令:严寒收藏;肾阳易耗,宜温阳保暖,防受寒、关节与泌尿问题",
};
function wuyunLiuqi(yearGZidx, lonSun) {
  const stem = yearGZidx % 10,
    br = yearGZidx % 12;
  const yun = WY_YUN.find((x) => x[0] === stem % 5)[1],
    taiguo = stem % 2 === 0;
  const yi = WY_FIVE.indexOf(yun);
  const st = LQ_SITIAN_FIX(br),
    zaiquan = (st + 3) % 6;
  // 客气:三之气司天,终之气在泉,按三阴三阳序
  const guest = [];
  for (let s = 0; s < 6; s++) guest[s] = LQ_ORDER[(((st - 2 + s) % 6) + 6) % 6];
  const lqPos = (lonSun - 300 + 720) % 360;
  const step = Math.min(5, Math.floor(lqPos / 60));
  // 主运:初运起大寒,每运 72°,木火土金水;客运:初运=岁运,按五行相生序
  const yunStep = Math.min(4, Math.floor(lqPos / 72));
  const zhuYun = WY_FIVE[yunStep],
    keYun = WY_FIVE[(yi + yunStep) % 5];
  const yunSteps = [0, 1, 2, 3, 4].map((i) => ({ zhu: WY_FIVE[i], ke: WY_FIVE[(yi + i) % 5] }));
  // 客运太过不及:岁运太过则初运太过,以下按五运阴阳递变(简化:同岁运“太过/不及”属性交替)
  const tg = (i) => ((taiguo ? i % 2 === 0 : i % 2 === 1) ? "太过" : "不及");
  return {
    yun,
    taiguo,
    yunName: `${yun}运${taiguo ? "太过" : "不及"}`,
    siTian: LQ_ORDER[st],
    zaiQuan: LQ_ORDER[zaiquan],
    guest,
    zhu: LQ_ZHU,
    step,
    yunStep,
    zhuYun,
    keYun,
    yunSteps,
    tip: LQ_TIP[guest[step]],
    zhuTip: LQ_TIP[LQ_ZHU[step]],
    tg,
    gz: GAN[stem] + ZHI[br],
  };
}
/* 子午流注(纳支法):十二经脉各主一个时辰 */
const ZW_LZ = [
  ["子", "胆", "足少阳胆经", "阳", 0, "胆气升发,宜静卧养胆,子时前入睡"],
  ["丑", "肝", "足厥阴肝经", "阴", 0, "肝藏血,宜深睡以养血"],
  ["寅", "肺", "手太阴肺经", "阴", 3, "肺朝百脉,宜深睡,晨起吐纳"],
  ["卯", "大肠", "手阳明大肠经", "阳", 3, "宜起床排便、喝温水"],
  ["辰", "胃", "足阳明胃经", "阳", 2, "宜进早餐,营养充足"],
  ["巳", "脾", "足太阴脾经", "阴", 2, "脾主运化,宜工作学习效率高"],
  ["午", "心", "手少阴心经", "阴", 1, "宜小憩养心,避免大怒大喜"],
  ["未", "小肠", "手太阳小肠经", "阳", 1, "分清泌浊,宜午后补水"],
  ["申", "膀胱", "足太阳膀胱经", "阳", 4, "宜多饮水,利于排毒;学习效率佳"],
  ["酉", "肾", "足少阴肾经", "阴", 4, "肾藏精,宜养神,避免过劳"],
  ["戌", "心包", "手厥阴心包经", "阴", 1, "宜放松心情、散步、社交"],
  ["亥", "三焦", "手少阳三焦经", "阳", 1, "三焦通百脉,宜准备入睡"],
];
const ZODIAC12 = ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"];

/* =====================================================================
   星盘完整版与吠陀占星:宫位制 · 阿拉伯点 · 太阳回归 · 次限 · 组合盘 · 恒星黄道 · 27宿 · Vimshottari · D9 · 五支历
   行星黄经来自本站 asPlanets(已与 Astronomy Engine 对拍);宫位与大运为确定性公式。
   ===================================================================== */
const A2_SIGN = [
  "白羊",
  "金牛",
  "双子",
  "巨蟹",
  "狮子",
  "处女",
  "天秤",
  "天蝎",
  "射手",
  "摩羯",
  "水瓶",
  "双鱼",
];
const A2_GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];
const A2_ELEM = ["火", "土", "风", "水", "火", "土", "风", "水", "火", "土", "风", "水"];
const A2_NORM = (x) => ((x % 360) + 360) % 360,
  A2_W180 = (x) => (((x % 360) + 540) % 360) - 180,
  A2_R = Math.PI / 180;
function a2Eps(jd) {
  const T = (jd - 2451545) / 36525;
  return (23.439291 - 0.0130042 * T) * A2_R;
}
function a2Ramc(jd, lonE) {
  const T = (jd - 2451545) / 36525;
  return A2_NORM(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T + lonE);
}
const a2RA = (lam, eps) =>
  A2_NORM(Math.atan2(Math.sin(lam * A2_R) * Math.cos(eps), Math.cos(lam * A2_R)) / A2_R);
const a2Dec = (lam, eps) => Math.asin(Math.sin(eps) * Math.sin(lam * A2_R));
function a2Angles(jd, lonE, latN) {
  const ramc = a2Ramc(jd, lonE),
    eps = a2Eps(jd),
    phi = latN * A2_R,
    l = ramc * A2_R;
  const mc = A2_NORM(Math.atan2(Math.sin(l), Math.cos(l) * Math.cos(eps)) / A2_R);
  let asc = A2_NORM(
    Math.atan2(Math.cos(l), -(Math.sin(l) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps))) / A2_R,
  );
  if (A2_NORM(asc - mc) > 180) asc = A2_NORM(asc + 180);
  return { ramc, eps, mc, asc, ic: A2_NORM(mc + 180), dsc: A2_NORM(asc + 180) };
}
/* 在 [from,to](黄经弧,from→to 递增)内解 H(λ)=−f·DSA(λ) 等条件;f 为从子午线向地平线推进的比例 */
function a2PlacCusp(A, latN, from, span, target) {
  const phi = latN * A2_R;
  const H = (lam) => A2_W180(A.ramc - a2RA(lam, A.eps)); // 时角(西正)
  const fn = (lam) => {
    const d = a2Dec(lam, A.eps),
      c = -Math.tan(phi) * Math.tan(d),
      dsa = Math.acos(Math.max(-1, Math.min(1, c))) / A2_R,
      nsa = 180 - dsa;
    return A2_W180(H(lam) - target(dsa, nsa));
  };
  let a = 0,
    fa = fn(A2_NORM(from)),
    found = null;
  const N = Math.max(120, Math.ceil(span * 2));
  for (let i = 1; i <= N; i++) {
    const b = (span * i) / N,
      fb = fn(A2_NORM(from + b));
    if (fa === 0) {
      found = [a, a];
      break;
    }
    if (fa * fb < 0 && Math.abs(fa - fb) < 90) {
      found = [a, b];
      break;
    }
    a = b;
    fa = fb;
  }
  if (!found) return null;
  let lo = found[0],
    hi = found[1];
  for (let k = 0; k < 50; k++) {
    const mid = (lo + hi) / 2,
      fm = fn(A2_NORM(from + mid));
    if (fn(A2_NORM(from + lo)) * fm <= 0) hi = mid;
    else lo = mid;
  }
  return A2_NORM(from + (lo + hi) / 2);
}
function a2Houses(jd, lonE, latN, sys) {
  const A = a2Angles(jd, lonE, latN),
    asc = A.asc,
    mc = A.mc,
    out = new Array(12);
  if (sys === "whole") {
    const s = Math.floor(asc / 30) * 30;
    for (let i = 0; i < 12; i++) out[i] = A2_NORM(s + 30 * i);
    return { A, cusps: out, sys, note: "整宫制:上升点所在星座整座为第一宫" };
  }
  if (sys === "equal") {
    for (let i = 0; i < 12; i++) out[i] = A2_NORM(asc + 30 * i);
    return { A, cusps: out, sys, note: "等宫制:自上升点起每宫 30°" };
  }
  if (sys === "porphyry" || Math.abs(latN) > 66.5 || sys !== "placidus") {
    const d1 = A2_NORM(asc - mc),
      d2 = A2_NORM(A.ic - asc);
    out[9] = mc;
    out[0] = asc;
    out[10] = A2_NORM(mc + d1 / 3);
    out[11] = A2_NORM(mc + (2 * d1) / 3);
    out[1] = A2_NORM(asc + d2 / 3);
    out[2] = A2_NORM(asc + (2 * d2) / 3);
    out[3] = A.ic;
    for (let i = 4; i < 9; i++) out[i] = A2_NORM(out[(i + 6) % 12] + 180);
    return {
      A,
      cusps: out,
      sys: "porphyry",
      note:
        sys === "placidus"
          ? "纬度高于 66.5°,普拉西德制不适用,已改用波菲利制。"
          : "波菲利制:四角之间三等分",
    };
  }
  out[9] = mc;
  out[0] = asc;
  out[3] = A.ic;
  const c11 = a2PlacCusp(A, latN, mc, A2_NORM(asc - mc), (dsa) => -dsa / 3),
    c12 = a2PlacCusp(A, latN, mc, A2_NORM(asc - mc), (dsa) => (-2 * dsa) / 3);
  const c2 = a2PlacCusp(A, latN, asc, A2_NORM(A.ic - asc), (dsa, nsa) => -(dsa + nsa / 3)),
    c3 = a2PlacCusp(A, latN, asc, A2_NORM(A.ic - asc), (dsa, nsa) => -(dsa + (2 * nsa) / 3));
  if ([c11, c12, c2, c3].some((x) => x == null)) return a2Houses(jd, lonE, latN, "porphyry");
  out[10] = c11;
  out[11] = c12;
  out[1] = c2;
  out[2] = c3;
  for (let i = 4; i < 9; i++) out[i] = A2_NORM(out[(i + 6) % 12] + 180);
  return { A, cusps: out, sys: "placidus", note: "普拉西德制:按半弧三分" };
}
function a2HouseOf(lon, cusps) {
  for (let i = 0; i < 12; i++) {
    const a = cusps[i],
      b = cusps[(i + 1) % 12],
      d = A2_NORM(lon - a),
      w = A2_NORM(b - a);
    if (d < w) return i + 1;
  }
  return 1;
}
function a2Chart(jd, lonE, latN, sys) {
  const H = a2Houses(jd, lonE, latN, sys),
    P = asPlanets(jd).map((p) => ({
      n: p.n,
      g: p.g,
      lon: p.lon,
      retro: p.retro,
      speed: p.speed,
      sign: Math.floor(p.lon / 30),
      deg: p.lon % 30,
      house: a2HouseOf(p.lon, H.cusps),
    }));
  const sun = P.find((p) => p.n === "太阳"),
    moon = P.find((p) => p.n === "月亮"),
    day = A2_NORM(sun.lon - H.A.asc) > 180;
  const fort = A2_NORM(H.A.asc + (day ? moon.lon - sun.lon : sun.lon - moon.lon)),
    spir = A2_NORM(H.A.asc + (day ? sun.lon - moon.lon : moon.lon - sun.lon));
  const parts = [
    {
      n: "福点(Fortune)",
      lon: fort,
      sign: Math.floor(fort / 30),
      deg: fort % 30,
      house: a2HouseOf(fort, H.cusps),
    },
    {
      n: "精神点(Spirit)",
      lon: spir,
      sign: Math.floor(spir / 30),
      deg: spir % 30,
      house: a2HouseOf(spir, H.cusps),
    },
  ];
  return {
    jd,
    lonE,
    latN,
    sys: H.sys,
    note: H.note,
    A: H.A,
    cusps: H.cusps,
    planets: P,
    parts,
    day,
    aspects: asAspects(P.map((p) => ({ n: p.n, lon: p.lon, g: p.g }))),
  };
}
/* 太阳回归:太阳回到本命黄经的时刻(牛顿迭代) */
function a2SolarReturn(jdBirth, year) {
  const L0 = sunLon(jdBirth),
    by = fromJD(jdBirth + 8 / 24).y;
  let jd = jdBirth + (year - by) * 365.2422;
  for (let i = 0; i < 40; i++) {
    const d = A2_W180(L0 - sunLon(jd));
    jd += d / 0.9856;
    if (Math.abs(d) < 1e-7) break;
  }
  return jd;
}
/* 次限:一日一年 */
function a2Progressed(jdBirth, jdTarget) {
  return jdBirth + (jdTarget - jdBirth) / 365.2422;
}
/* 组合盘:中点(取短弧) */
const a2Mid = (a, b) => A2_NORM(a + A2_W180(b - a) / 2);
function a2Composite(cA, cB) {
  const P = cA.planets.map((p) => {
    const q = cB.planets.find((x) => x.n === p.n),
      lon = a2Mid(p.lon, q.lon);
    return { n: p.n, g: p.g, lon, retro: false, sign: Math.floor(lon / 30), deg: lon % 30 };
  });
  const asc = a2Mid(cA.A.asc, cB.A.asc),
    mc = a2Mid(cA.A.mc, cB.A.mc),
    cusps = [];
  for (let i = 0; i < 12; i++) cusps.push(A2_NORM(asc + 30 * i));
  P.forEach((p) => {
    p.house = a2HouseOf(p.lon, cusps);
  });
  return {
    planets: P,
    A: { asc, mc, ic: A2_NORM(mc + 180), dsc: A2_NORM(asc + 180) },
    cusps,
    sys: "equal",
    note: "组合盘:各点取两人黄经的短弧中点;宫位按组合上升点等宫制(简化)。",
    parts: [],
    aspects: asAspects(P.map((p) => ({ n: p.n, lon: p.lon, g: p.g }))),
  };
}

/* ---------- 吠陀占星 ---------- */
function v2Ayanamsa(jd) {
  const T = (jd - 2451545) / 36525;
  return 23.8571 + 1.3969713 * T + 0.000308 * T * T;
} // 拉希里近似,±0.01°
const V2_NAK = [
  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "P.Phalguni",
  "U.Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "P.Ashadha",
  "U.Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "P.Bhadrapada",
  "U.Bhadrapada",
  "Revati",
];
const V2_NAKCN = [
  "娄",
  "胃",
  "昴",
  "毕",
  "觜",
  "参",
  "井",
  "鬼",
  "柳",
  "星",
  "张",
  "翼",
  "轸",
  "角",
  "亢",
  "氐",
  "房",
  "心",
  "尾",
  "箕",
  "斗",
  "女",
  "虚",
  "危",
  "室",
  "壁",
  "奎",
];
const V2_LORD = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"],
  V2_LORDCN = ["计都", "金星", "太阳", "月亮", "火星", "罗睺", "木星", "土星", "水星"],
  V2_YRS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
function v2Nak(sid) {
  const n = A2_NORM(sid),
    w = 360 / 27,
    i = Math.floor(n / w),
    pada = Math.floor((n - i * w) / (w / 4)) + 1,
    frac = (n - i * w) / w;
  return { i, pada, frac, name: V2_NAK[i], cn: V2_NAKCN[i], lord: i % 9 };
}
function v2Dasha(jdBirth, moonSid, levels) {
  const nk = v2Nak(moonSid),
    Y = 365.25,
    list = [];
  let t = jdBirth - nk.frac * V2_YRS[nk.lord] * Y; // 回推到首个大运的起点
  for (let c = 0; c < 9; c++) {
    const li = (nk.lord + c) % 9,
      len = V2_YRS[li] * Y,
      md = { lord: li, start: t, end: t + len, sub: [] };
    let s = t;
    for (let k = 0; k < 9; k++) {
      const si = (li + k) % 9,
        sl = (len * V2_YRS[si]) / 120;
      md.sub.push({ lord: si, start: s, end: s + sl });
      s += sl;
    }
    list.push(md);
    t += len;
  }
  return { nak: nk, list, balance: (1 - nk.frac) * V2_YRS[nk.lord] };
}
function v2Navamsa(sid) {
  const n = A2_NORM(sid),
    s = Math.floor(n / 30),
    k = Math.floor((n - s * 30) / (30 / 9));
  const start = [0, 8, 4][s % 3 === 0 ? 0 : s % 3 === 1 ? 1 : 2]; // 动宫自身、固定宫第9、双体宫第5
  // 动宫(白羊蟹秤摩 s%3==0)起自本宫;固定宫(金牛狮蝎水瓶 s%3==1)起自第9宫;双体宫(双子处射双鱼 s%3==2)起自第5宫
  const off = s % 3 === 0 ? 0 : s % 3 === 1 ? 8 : 4;
  return (s + off + k) % 12;
}
const V2_TITHI = [
  "Pratipada",
  "Dwitiya",
  "Tritiya",
  "Chaturthi",
  "Panchami",
  "Shashthi",
  "Saptami",
  "Ashtami",
  "Navami",
  "Dashami",
  "Ekadashi",
  "Dwadashi",
  "Trayodashi",
  "Chaturdashi",
];
const V2_YOGA = [
  "Vishkambha",
  "Priti",
  "Ayushman",
  "Saubhagya",
  "Shobhana",
  "Atiganda",
  "Sukarma",
  "Dhriti",
  "Shula",
  "Ganda",
  "Vriddhi",
  "Dhruva",
  "Vyaghata",
  "Harshana",
  "Vajra",
  "Siddhi",
  "Vyatipata",
  "Variyana",
  "Parigha",
  "Shiva",
  "Siddha",
  "Sadhya",
  "Shubha",
  "Shukla",
  "Brahma",
  "Indra",
  "Vaidhriti",
];
const V2_KAR7 = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"],
  V2_VARA = [
    "日曜(Sun)",
    "月曜(Mon)",
    "火曜(Tue)",
    "水曜(Wed)",
    "木曜(Thu)",
    "金曜(Fri)",
    "土曜(Sat)",
  ];
function v2Panchanga(jdUT, sunTrop, moonTrop, weekday) {
  const ay = v2Ayanamsa(jdUT),
    el = A2_NORM(moonTrop - sunTrop),
    ti = Math.floor(el / 12) + 1,
    pak = ti <= 15 ? "白分(Shukla)" : "黑分(Krishna)",
    tn = ti === 15 ? "Purnima" : ti === 30 ? "Amavasya" : V2_TITHI[(ti - 1) % 15];
  const mSid = A2_NORM(moonTrop - ay),
    sSid = A2_NORM(sunTrop - ay),
    nk = v2Nak(mSid),
    yo = Math.floor(A2_NORM(mSid + sSid) / (360 / 27)),
    ka = Math.floor(el / 6) + 1;
  const kn =
    ka === 1
      ? "Kimstughna"
      : ka === 58
        ? "Shakuni"
        : ka === 59
          ? "Chatushpada"
          : ka === 60
            ? "Naga"
            : V2_KAR7[(ka - 2) % 7];
  return {
    tithi: ti,
    tithiName: tn,
    paksha: pak,
    nak: nk,
    yoga: yo + 1,
    yogaName: V2_YOGA[yo],
    karana: ka,
    karanaName: kn,
    vara: V2_VARA[weekday],
    ayan: ay,
  };
}
function v2Chart(jdUT, lonE, latN) {
  const ay = v2Ayanamsa(jdUT),
    Pt = asPlanets(jdUT),
    want = ["太阳", "月亮", "火星", "水星", "木星", "金星", "土星"],
    en = { 太阳: "Su", 月亮: "Mo", 火星: "Ma", 水星: "Me", 木星: "Ju", 金星: "Ve", 土星: "Sa" };
  const T = (jdUT - 2451545) / 36525,
    rahuT = A2_NORM(125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000); // 平均月交点
  const pls = want.map((n) => {
    const p = Pt.find((x) => x.n === n),
      sid = A2_NORM(p.lon - ay);
    return {
      n,
      k: en[n],
      trop: p.lon,
      sid,
      sign: Math.floor(sid / 30),
      deg: sid % 30,
      retro: p.retro,
      nak: v2Nak(sid),
      nv: v2Navamsa(sid),
    };
  });
  const rs = A2_NORM(rahuT - ay),
    ks = A2_NORM(rs + 180);
  [
    ["罗睺(Rahu)", "Ra", rs],
    ["计都(Ketu)", "Ke", ks],
  ].forEach(([n, k, s]) =>
    pls.push({
      n,
      k,
      trop: A2_NORM(s + ay),
      sid: s,
      sign: Math.floor(s / 30),
      deg: s % 30,
      retro: true,
      nak: v2Nak(s),
      nv: v2Navamsa(s),
    }),
  );
  const A = a2Angles(jdUT, lonE, latN),
    lag = A2_NORM(A.asc - ay);
  return {
    ay,
    planets: pls,
    lagna: {
      sid: lag,
      sign: Math.floor(lag / 30),
      deg: lag % 30,
      nak: v2Nak(lag),
      nv: v2Navamsa(lag),
    },
  };
}

/* =====================================================================
   紫微斗数增强:六吉六煞(魁钺/禄存/羊陀/火铃/空劫/天马) · 亮度 · 长生十二神 · 命主身主 · 三方四正 · 流年
   亮度表、星曜落宫经 iztro(MIT) 逐盘对拍校验后固化。
   ===================================================================== */
const ZW_BRIGHT = {
  文曲: "得庙平旺得庙陷旺得庙陷旺",
  天同: "旺不利平平庙陷不旺平平庙",
  陀罗: "-庙陷-庙陷-庙陷-庙陷",
  武曲: "旺庙得利庙平旺庙得利庙平",
  破军: "庙旺得陷旺平庙旺得陷旺平",
  太阳: "陷不旺庙旺旺旺得得平不陷",
  擎羊: "陷庙-陷庙-陷庙-陷庙-",
  天府: "庙庙庙得庙得旺庙得旺庙得",
  天机: "庙陷得旺利平庙陷得旺利平",
  太阴: "庙庙旺陷陷陷不不利旺旺庙",
  紫微: "平庙旺旺得旺庙庙旺旺得旺",
  贪狼: "旺庙平利庙陷旺庙平利庙陷",
  铃星: "陷得庙利陷得庙利陷得庙利",
  巨门: "旺不庙庙陷旺旺不庙庙陷旺",
  天相: "庙庙庙陷得得庙得庙陷得得",
  文昌: "得庙陷利得庙陷利得庙陷利",
  天梁: "庙旺庙庙庙陷庙旺陷得庙陷",
  廉贞: "平利庙平利陷平利庙平利陷",
  七杀: "旺庙庙旺庙平旺庙庙旺庙平",
  火星: "陷得庙利陷得庙利陷得庙利",
};
const ZW_LUCUN = [2, 3, 5, 6, 5, 6, 8, 9, 11, 0];
const ZW_KUIYUE = [
  [1, 7],
  [0, 8],
  [11, 9],
  [11, 9],
  [1, 7],
  [0, 8],
  [1, 7],
  [6, 2],
  [3, 5],
  [3, 5],
]; // [魁,钺]:甲戊庚 丑未;乙己 子申;丙丁 亥酉;辛 午寅;壬癸 卯巳(经 iztro 对拍)
const ZW_CS = ["长生", "沐浴", "冠带", "临官", "帝旺", "衰", "病", "死", "墓", "绝", "胎", "养"];
const ZW_MING_STAR = [
  "贪狼",
  "巨门",
  "禄存",
  "文曲",
  "廉贞",
  "武曲",
  "破军",
  "武曲",
  "廉贞",
  "文曲",
  "禄存",
  "巨门",
];
const ZW_SHEN_STAR = [
  "火星",
  "天相",
  "天梁",
  "天同",
  "文昌",
  "天机",
  "火星",
  "天相",
  "天梁",
  "天同",
  "文昌",
  "天机",
];
function ziweiPlus(zw, lunar, hb, gender) {
  const ys = zw.ys,
    yb = mod(lunar.year - 4, 12);
  const put = (n, b, t) => {
    const p = zw.pal[mod(b, 12)];
    p.stars.push({ n, t });
  };
  const lu = ZW_LUCUN[ys];
  put("禄存", lu, "lu");
  put("擎羊", lu + 1, "sha");
  put("陀罗", lu - 1, "sha");
  put("天魁", ZW_KUIYUE[ys][0], "aux");
  put("天钺", ZW_KUIYUE[ys][1], "aux");
  const grp = [
    [2, 6, 10],
    [8, 0, 4],
    [5, 9, 1],
    [11, 3, 7],
  ].findIndex((g) => g.includes(yb));
  put("天马", [8, 2, 11, 5][grp], "lu");
  put("火星", [1, 2, 3, 9][grp] + hb, "sha");
  put("铃星", [3, 10, 10, 10][grp] + hb, "sha");
  put("地劫", 11 + hb, "sha");
  put("地空", 11 - hb, "sha");
  // 亮度
  zw.pal.forEach((p) =>
    p.stars.forEach((s) => {
      const t = ZW_BRIGHT[s.n];
      if (t) {
        const c = t[p.b];
        if (c && c !== "-") s.br = c;
      }
    }),
  );
  // 四化标记对新增星无影响;长生十二神
  const start = { 2: 8, 5: 8, 3: 11, 4: 5, 6: 2 }[zw.ju],
    fwd = zw.fwd;
  zw.pal.forEach((p) => {
    p.cs = ZW_CS[fwd ? mod(p.b - start, 12) : mod(start - p.b, 12)];
  });
  zw.mingStar = ZW_MING_STAR[zw.ming];
  zw.shenStar = ZW_SHEN_STAR[yb];
  // 三方四正
  zw.san = (b) => [b, mod(b + 6, 12), mod(b + 4, 12), mod(b + 8, 12)];
  return zw;
}
function ziweiYears(zw, y0, n) {
  const out = [];
  for (let y = y0; y < y0 + n; y++) {
    const ys = mod(y - 4, 10),
      yb = mod(y - 4, 12),
      sh = SIHUA[ys];
    const pal = zw.pal[yb];
    const flies = sh.map((name, i) => {
      let at = null;
      zw.pal.forEach((p) =>
        p.stars.forEach((s) => {
          if (s.n === name) at = p;
        }),
      );
      return {
        h: ["禄", "权", "科", "忌"][i],
        star: name,
        pal: at ? at.name : "-",
        b: at ? at.b : -1,
      };
    });
    const age = y - zw.lunarYear + 1;
    out.push({ y, gz: gz(y - 4), b: yb, palName: pal.name, age, flies });
  }
  return out;
}

/* =====================================================================
   紫微斗数:杂曜(38 曜)与博士/将前/岁前十二神 安星
   算法与 iztro(MIT)的通行“三合派”口径一致,经逐盘对拍后固化。位置一律用地支序号(子=0)。
   ===================================================================== */
const ZW_B = (s) => "子丑寅卯辰巳午未申酉戌亥".indexOf(s);
const ZW_YUEJIE = ["申", "戌", "子", "寅", "辰", "午"].map(ZW_B);
const ZW_TIANYUE = ["戌", "巳", "辰", "寅", "未", "卯", "亥", "未", "寅", "午", "戌", "寅"].map(
  ZW_B,
);
const ZW_TIANWU = ["巳", "申", "寅", "亥"].map(ZW_B);
const ZW_YINSHA = ["寅", "子", "戌", "申", "午", "辰"].map(ZW_B);
const ZW_TGUAN = ["未", "辰", "巳", "寅", "卯", "酉", "亥", "酉", "戌", "午"].map(ZW_B);
const ZW_TFU = ["酉", "申", "子", "亥", "卯", "寅", "午", "巳", "午", "巳"].map(ZW_B);
const ZW_TCHU = ["巳", "午", "子", "巳", "午", "申", "寅", "午", "酉", "亥"].map(ZW_B);
const ZW_JIELU = ["申", "午", "辰", "寅", "子"].map(ZW_B);
const ZW_KONGWANG = ["酉", "未", "巳", "卯", "丑"].map(ZW_B);
const ZW_FEILIAN = ["申", "酉", "戌", "巳", "午", "未", "寅", "卯", "辰", "亥", "子", "丑"].map(
  ZW_B,
);
const ZW_POSUI = ["巳", "丑", "酉"].map(ZW_B);
const ZW_NIANJIE = ["戌", "酉", "申", "未", "午", "巳", "辰", "卯", "寅", "丑", "子", "亥"].map(
  ZW_B,
);
const ZW_DAHAO_MAP = ["未", "午", "酉", "申", "亥", "戌", "丑", "子", "卯", "寅", "巳", "辰"].map(
  ZW_B,
);
const ZW_BOSHI = [
  "博士",
  "力士",
  "青龙",
  "小耗",
  "将军",
  "奏书",
  "飞廉",
  "喜神",
  "病符",
  "大耗",
  "伏兵",
  "官府",
];
const ZW_JQ = [
  "将星",
  "攀鞍",
  "岁驿",
  "息神",
  "华盖",
  "劫煞",
  "灾煞",
  "天煞",
  "指背",
  "咸池",
  "月煞",
  "亡神",
];
const ZW_SQ = [
  "太岁",
  "晦气",
  "丧门",
  "贯索",
  "官符",
  "小耗",
  "大耗",
  "龙德",
  "白虎",
  "天德",
  "吊客",
  "病符",
];
function ziweiAdj(zw, lunar, hb, gender) {
  const yb = mod(lunar.year - 4, 12),
    ys = mod(lunar.year - 4, 10),
    m0 = zw.m - 1,
    d0 = lunar.day - 1;
  const tab = {},
    put = (n, b) => {
      const k = mod(b, 12);
      (tab[k] = tab[k] || []).push(n);
    };
  const zuo = 4 + m0,
    you = 10 - m0,
    chang = 10 - hb,
    qu = 4 + hb;
  // 红鸾天喜:卯-年支;天喜=红鸾+6
  put("红鸾", 3 - yb);
  put("天喜", 9 - yb);
  const g3 = [
    [2, 6, 10],
    [8, 0, 4],
    [5, 9, 1],
    [11, 3, 7],
  ].findIndex((g) => g.includes(yb));
  put("天姚", 1 + m0);
  put("咸池", [3, 9, 6, 0][g3]);
  put("解神", ZW_YUEJIE[Math.floor(m0 / 2)]);
  put("三台", zuo + d0);
  put("八座", you - d0);
  put("恩光", chang + d0 - 1);
  put("天贵", qu + d0 - 1);
  put("龙池", 4 + yb);
  put("凤阁", 10 - yb);
  put("天才", zw.ming + yb);
  put("天寿", zw.shen + yb);
  put("台辅", 6 + hb);
  put("封诰", 2 + hb);
  put("天巫", ZW_TIANWU[m0 % 4]);
  put("华盖", [10, 4, 1, 7][g3]);
  put("天官", ZW_TGUAN[ys]);
  put("天福", ZW_TFU[ys]);
  put("天厨", ZW_TCHU[ys]);
  put("天月", ZW_TIANYUE[m0]);
  put("天德", 9 + yb);
  put("月德", 5 + yb);
  put("天空", yb + 1);
  let xk = yb + 9 - ys + 1;
  if (xk % 2 !== yb % 2) xk += 1;
  put("旬空", xk);
  put("截路", ZW_JIELU[ys % 5]);
  put("空亡", ZW_KONGWANG[ys % 5]);
  const gg = [
    [5, 1],
    [8, 4],
    [11, 7],
    [2, 10],
  ][Math.floor(mod(yb - 2, 12) / 3)];
  put("孤辰", gg[0]);
  put("寡宿", gg[1]);
  put("蜚廉", ZW_FEILIAN[yb]);
  put("破碎", ZW_POSUI[yb % 3]);
  put("天刑", 9 + m0);
  put("阴煞", ZW_YINSHA[m0 % 6]);
  put("天哭", 6 - yb);
  put("天虚", 6 + yb);
  put("天使", zw.ming + 7);
  put("天伤", zw.ming + 5);
  put("年解", ZW_NIANJIE[yb]);
  // 三个十二神
  const lu = ZW_LUCUN[ys],
    fwd = zw.fwd;
  const boshi = {};
  for (let i = 0; i < 12; i++) boshi[mod(fwd ? lu + i : lu - i, 12)] = ZW_BOSHI[i];
  const jqStart = [6, 0, 9, 3][
    [
      [2, 6, 10],
      [8, 0, 4],
      [5, 9, 1],
      [11, 3, 7],
    ].findIndex((g) => g.includes(yb))
  ];
  const jiang = {};
  for (let i = 0; i < 12; i++) jiang[mod(jqStart + i, 12)] = ZW_JQ[i];
  const sui = {};
  for (let i = 0; i < 12; i++) sui[mod(yb + i, 12)] = ZW_SQ[i];
  zw.pal.forEach((p) => {
    p.adj = (tab[p.b] || []).slice();
    p.boshi = boshi[p.b];
    p.jiang = jiang[p.b];
    p.sui = sui[p.b];
  });
  zw.adjTab = tab;
  return zw;
}

/* =====================================================================
   紫微斗数 · 命盘解读引擎(规则化生成)
   依据:《紫微斗数全书》《十八飞星》及通行讲义的星性、庙陷、四化、三方四正与格局歌诀。
   方法:星性 × 亮度 × 宫位主题 × 四化 × 吉煞会照 → 逐宫小结;再检测传统格局。
   声明:不同派别(三合/飞星/中州/钦天)取法差异很大,以下为通行口径的“倾向性描述”,不是命运断语。
   ===================================================================== */
const RD_STAR = {
  紫微: {
    wx: "阴土",
    qual: "帝座·尊贵",
    tag: "领导、格局、体面",
    pos: "气度端凝,有统筹全局与担当的格局,自尊心强,重名位与体面",
    neg: "孤高好面子,易猜疑或事事亲力亲为;若无辅佐则成“孤君”,有权无人助",
    self: "为人端正稳重,有领导气质,喜居主位,凡事讲究格局与分寸",
    work: "适合居于统筹、管理、决策位置,宜大平台;不甘久居人下",
    love: "重尊严,对伴侣有“格局”要求,易由欣赏走向掌控,需学会示弱",
    wealth: "以位取财、以名带利,重资源整合而非小利;忌好大喜功",
    health: "脾胃、头脑神经与压力性问题,情绪紧绷时易失眠",
    soc: "受人敬重,但姿态过高易有距离感",
  },
  天机: {
    wx: "阴木",
    qual: "智慧·善变",
    tag: "谋略、学习、变动",
    pos: "反应敏捷,善分析策划,学习力强,好奇心重",
    neg: "思虑过多、心神不宁、变动频繁,想得多做得少",
    self: "机敏多思,善于观察与推演,内心常有多个盘算",
    work: "宜策划、研究、咨询、技术、参谋类工作,靠脑力与信息差取胜",
    love: "心思细腻、易多想,需要坦率沟通以免猜测消耗关系",
    wealth: "以智取财、财随变化,宜靠专业与技能,不宜赌性投机",
    health: "肝胆、神经、睡眠与焦虑倾向",
    soc: "点子多、消息灵通,但主意易变,让人难以捉摸",
  },
  太阳: {
    wx: "阳火",
    qual: "光明·付出",
    tag: "名誉、热忱、公众",
    pos: "热情磊落,有公益心与感染力,重名声,乐于付出(庙旺时光芒外显)",
    neg: "操劳奔波、付出多回报迟,陷地则名不副实、易受累",
    self: "开朗外向、光明磊落,爱面子重义气,常为他人操心",
    work: "适合公职、教育、传播、对外性岗位,名重于利",
    love: "热情主动,付出型;男命多主妻缘、女命多主夫子,陷地则感情中辛苦",
    wealth: "名大于利,以贵带财,不擅锱铢必较",
    health: "眼睛、头部、心血管,劳累过度易伤阳气",
    soc: "广结善缘,易替人担事,注意别做“老好人”",
  },
  武曲: {
    wx: "阴金",
    qual: "财星·刚毅",
    tag: "财务、执行、决断",
    pos: "果决务实,理财能力强,执行力与意志力足",
    neg: "刚硬孤克、言直少婉转,情感表达偏弱",
    self: "刚毅果断、重实际,行动多于言语,不喜虚饰",
    work: "宜金融、财务、实业、工程、军警等重执行与责任的工作",
    love: "务实寡言,爱在行动上而非言语,需注意柔和度",
    wealth: "正财之星,靠实干积累、稳扎稳打,忌孤注一掷",
    health: "肺、呼吸道、筋骨,外伤与手术倾向",
    soc: "重信用但不圆滑,朋友少而精",
  },
  天同: {
    wx: "阳水",
    qual: "福星·温和",
    tag: "享受、随和、情感",
    pos: "温和知足,人缘好,重情义,懂得享受生活",
    neg: "安逸懒散、缺魄力、拖延,遇事想逃避冲突",
    self: "性情温厚、随遇而安,不爱争,心软易受感动",
    work: "宜服务、教育、文化、福利、协调类工作,稳定环境更能发挥",
    love: "温柔体贴、重感受,易因迁就而压抑自己",
    wealth: "财来财去、重生活品质,宜稳定收入",
    health: "肾与泌尿、耳部、情绪性疾病",
    soc: "人缘佳、少冲突,但少主见",
  },
  廉贞: {
    wx: "阴火(次桃花)",
    qual: "囚星·情与法",
    tag: "原则、魅力、情感张力",
    pos: "聪敏有原则,公关魅力强,善于处理复杂关系",
    neg: "情绪起伏、感情波折、口舌是非,内心矛盾",
    self: "外柔内烈、感情浓烈,自我要求高,有独特魅力",
    work: "宜政法、公关、技术、企业管理,需在规则中发挥",
    love: "情感张力大,桃花与纠葛并存,忌三角与暧昧",
    wealth: "靠才技与人脉,收入起伏",
    health: "血液循环、炎症、心火、皮肤",
    soc: "有魅力也易结怨,交往宜界线分明",
  },
  天府: {
    wx: "阳土",
    qual: "库星·稳重",
    tag: "守成、财库、包容",
    pos: "稳重保守、包容有度,善理财守成,有组织协调力",
    neg: "过于谨慎、缺乏冒险,有惰性与保守倾向",
    self: "沉稳厚重、有分寸,重安全感与秩序",
    work: "宜财务、管理、行政、稳定型机构,擅长“守”与“聚”",
    love: "稳重负责、重家庭,表达含蓄",
    wealth: "库星,善积蓄、重资产配置,财路较正",
    health: "脾胃、消化系统,饮食宜节制",
    soc: "宽厚可倚,是他人眼中的“靠山”",
  },
  太阴: {
    wx: "阴水",
    qual: "富星·细腻",
    tag: "情感、积蓄、内在",
    pos: "温柔细腻、重家庭,财富积聚力强(庙旺时明显)",
    neg: "敏感忧郁、内向多虑,陷地则情绪起伏、聚财不易",
    self: "安静内敛、感受力强,重内心世界与家庭",
    work: "宜文艺、设计、金融、房产、幕僚及后勤统筹",
    love: "细腻体贴,需安全感,易因小事受伤",
    wealth: "田宅财富之星,主积累,宜置产与长线",
    health: "肾、妇科、眼睛与情志",
    soc: "内敛,与母亲及女性缘分深",
  },
  贪狼: {
    wx: "阳水(木)",
    qual: "欲望·多才",
    tag: "欲望、才艺、社交",
    pos: "多才多艺、社交活跃、进取心与欲望强,善于抓机会",
    neg: "贪多不专、欲望失控,酒色财气之诱惑",
    self: "活跃多面、好奇心强,对新事物有热情,也易见异思迁",
    work: "宜销售、娱乐、艺术、公关、餐饮等靠魅力与人脉的领域",
    love: "桃花旺、吸引力强,重情趣与新鲜感,需自律",
    wealth: "偏财与机会型,波动较大,宜控制杠杆与赌性",
    health: "肝肾、生殖系统、酒色所伤",
    soc: "应酬广、朋友多,注意“广而不深”",
  },
  巨门: {
    wx: "阴水(土)",
    qual: "暗星·口舌",
    tag: "口才、研究、是非",
    pos: "口才好、善分析与深究,适合以言语或专业立身",
    neg: "疑心重、口舌是非、猜忌与沟通障碍",
    self: "内心多疑多虑,爱钻研,表达力强而易伤人",
    work: "宜教育、律师、传媒、研究、医药,靠口才与专业",
    love: "沟通是关键,易因猜疑与言语生隙",
    wealth: "靠专业与口才,财路多波折,忌口舌招灾",
    health: "口腔、消化、胃部",
    soc: "是非多,宜谨言,避免传话",
  },
  天相: {
    wx: "阳水",
    qual: "印星·辅佐",
    tag: "服务、公正、协调",
    pos: "公正周到、善辅佐与调停,重形象与礼仪",
    neg: "优柔寡断、依赖他人,易被环境左右",
    self: "体贴周全、重礼数,有服务精神,主见有时不足",
    work: "宜秘书、行政、法律、管理辅助、外交,擅长“把事办周全”",
    love: "细心照顾型,情感中易委屈自己",
    wealth: "平稳,靠职位与服务收入",
    health: "皮肤、肾与泌尿",
    soc: "人缘好,善调解,易被夹在中间",
  },
  天梁: {
    wx: "阳土",
    qual: "荫星·清高",
    tag: "荫庇、监察、长者",
    pos: "稳重清高、有原则、善照顾与化解,常得长辈或贵人扶持",
    neg: "孤高说教、爱操心、与人有距离",
    self: "沉稳老成,有原则,常扮演照顾者角色",
    work: "宜医药、教育、监察、公益、顾问,擅长解难排忧",
    love: "偏长者型,与年龄差或师长型伴侣有缘",
    wealth: "不重钱,靠名望与荫庇,财帛宜稳",
    health: "脾胃与慢性病,宜早预防",
    soc: "得长辈提携,自己也乐于提携后辈",
  },
  七杀: {
    wx: "阴金(火)",
    qual: "将星·果断",
    tag: "魄力、开创、独立",
    pos: "果断有魄力、敢担当,善开创,独当一面",
    neg: "冲动孤直、起伏大,六亲缘分偏薄,易多变动",
    self: "刚烈直接、独立性强,遇事不退缩",
    work: "宜军警、创业、开拓、竞技类,有拼搏的舞台才能发挥",
    love: "感情强烈直接,起伏大,伴侣需能包容个性",
    wealth: "起伏明显,靠拼搏与胆识,忌冲动决策",
    health: "外伤、手术、呼吸系统",
    soc: "不喜依附,朋友以志同道合为主",
  },
  破军: {
    wx: "阴水",
    qual: "耗星·变革",
    tag: "破立、动荡、开拓",
    pos: "破旧立新、有冲劲与改革意识,敢闯敢试",
    neg: "破耗动荡、不安于现状,善始难终",
    self: "不服旧规、喜变化,一生多转折,勇于推倒重来",
    work: "宜变革、创业、开拓、重建类,怕一成不变",
    love: "感情多波折与变化,不易安定,需刻意经营",
    wealth: "大起大落,先破后立,忌盲目扩张",
    health: "泌尿、外伤、手术倾向",
    soc: "敢冲敢闯,常是“打破格局的人”",
  },
};
const RD_BR = { 庙: "庙", 旺: "旺", 得: "得地", 利: "利益", 平: "平和", 不: "不得地", 陷: "落陷" };
const RD_BRW = { 庙: 1.2, 旺: 1, 得: 0.5, 利: 0.3, 平: 0, 不: -0.6, 陷: -1.2 };
const RD_PAL = {
  命宫: { th: "一生根本:先天性格、才能格局与人生主轴", g: "self", noun: "个性与整体格局" },
  兄弟: {
    th: "手足同辈、同事伙伴与现金流转",
    g: "social",
    noun: "与手足同辈的关系",
    pre: "与手足同辈相处",
  },
  夫妻: { th: "婚恋观、配偶特质与感情模式", g: "love", noun: "感情婚姻" },
  子女: {
    th: "子女缘、晚辈下属、创作力与合伙关系",
    g: "social",
    noun: "子女与晚辈缘分",
    pre: "与子女晚辈相处",
  },
  财帛: { th: "求财方式、金钱观与财源", g: "wealth", noun: "财运与理财" },
  疾厄: { th: "体质、内在压力与灾厄根基", g: "health", noun: "身体状况" },
  迁移: {
    th: "外出运势、外在环境与他人眼中的你",
    g: "social",
    noun: "外出与人缘",
    pre: "在外与人交往",
  },
  交友: {
    th: "朋友同事下属、贵人与小人",
    g: "social",
    noun: "朋友与人际网络",
    pre: "与朋友下属相处",
  },
  官禄: { th: "事业方向、工作态度与成就", g: "work", noun: "事业发展" },
  田宅: { th: "不动产、家宅环境与家业积累", g: "wealth", noun: "家宅与家业积累" },
  福德: { th: "精神世界、福气享受与内在满足", g: "self", noun: "精神状态与福气" },
  父母: {
    th: "父母长辈上司缘分、文书证件与外貌",
    g: "social",
    noun: "与长辈上司的缘分",
    pre: "与长辈上司相处",
  },
};
const RD_HUA = {
  禄: "缘分与资源较佳,顺势而得",
  权: "主动争取、掌控欲强,能担事但易固执",
  科: "声誉条理占优,易得贵人与化解",
  忌: "易执着、牵挂或受阻,是需要用心经营之处",
};
const RD_AUX = {
  左辅: { k: "吉", g: "吉星", txt: "贵人助力、平辈扶持,主协助与辅佐" },
  右弼: { k: "吉", g: "吉星", txt: "贵人助力、异性或女性贵人,主协调与补位" },
  文昌: { k: "吉", g: "吉星", txt: "文才、考试、条理与正规文书,主科名与礼仪" },
  文曲: { k: "吉", g: "吉星", txt: "才艺、口才、艺术感,主灵巧与才情(亦带桃花色彩)" },
  天魁: { k: "吉", g: "吉星", txt: "阳贵人,主长辈上司之提携,逢关键时刻有人推一把" },
  天钺: { k: "吉", g: "吉星", txt: "阴贵人,主暗中助力与异性缘,机遇多来自私下人际" },
  禄存: { k: "吉", g: "禄马", txt: "正财之库、衣禄稳定,主守成与积累;性较保守" },
  天马: { k: "动", g: "禄马", txt: "主奔波、动迁与机遇,遇禄成“禄马交驰”,遇空劫则奔忙无成" },
  擎羊: {
    k: "凶",
    g: "煞星",
    txt: "刚烈冲克,主冲突、竞争、破耗与伤灾(亦是“刃”,可成决断力)",
    risk: "冲突、争斗、意外伤害",
  },
  陀罗: {
    k: "凶",
    g: "煞星",
    txt: "拖延纠缠,主迟滞、反复与内耗(亦有耐力)",
    risk: "拖延、纠缠、事情反复",
  },
  火星: {
    k: "凶",
    g: "煞星",
    txt: "急躁爆发,主突发变动、来去快(亦是行动力)",
    risk: "急躁冲动、突发事件",
  },
  铃星: {
    k: "凶",
    g: "煞星",
    txt: "阴沉内耗,主暗中消耗、隐忍后发(亦有韧性)",
    risk: "内耗、暗中受损",
  },
  地空: {
    k: "凶",
    g: "煞星",
    txt: "空灵超脱,主落空、不务实(亦是创意与哲思)",
    risk: "落空、想多做少",
  },
  地劫: { k: "凶", g: "煞星", txt: "劫夺破耗,主得而复失、外力剥夺", risk: "破耗、被劫夺" },
};
/* 杂曜:核心意义(去噪后的通行取象) */
const RD_ADJ = {
  红鸾: ["桃花·喜", "主婚恋喜事、情缘,与天喜同宫或对照尤显"],
  天喜: ["桃花·喜", "主喜庆、添丁、婚嫁与缘分,宜与红鸾会看"],
  天姚: ["桃花", "主异性魅力与感情纠葛,性情多情善感"],
  咸池: ["桃花", "主色情、酒色、桃花是非,亦是魅力与人缘"],
  龙池: ["才艺", "主技艺、手艺与雅趣,利文艺"],
  凤阁: ["才艺", "主气质、艺术、荣誉,与龙池同看"],
  天才: ["才智", "主天赋与才能,落宫处能有所发挥"],
  天寿: ["寿", "主福寿与耐力,健康根基之参考"],
  台辅: ["名位", "主名位、地位与品级,利职称"],
  封诰: ["名位", "主荣誉与封赏,利证书与官方认可"],
  三台: ["名位", "主地位与秩序,利官途"],
  八座: ["名位", "主威仪与尊位"],
  恩光: ["贵人", "主恩惠、提拔与荣誉"],
  天贵: ["贵人", "主尊贵与贵人缘"],
  天官: ["贵", "主官运与职位,喜见于官禄"],
  天福: ["福", "主福气与庇荫,利福德"],
  天厨: ["福", "主口福、饮食与厨艺,利餐饮"],
  天月: ["疾", "主体弱多疾、小病缠身,宜留意养护"],
  天德: ["解厄", "主逢凶化吉、德行庇护"],
  月德: ["解厄", "主福德与化解,偏助女性之缘"],
  天空: ["空", "主虚空、不实,思想玄奥;逢吉星易落空"],
  旬空: ["空", "主一时受阻、待时而发;逢煞反可化解"],
  截路: ["空", "主前途受阻、事有断续,阻碍多在关键处"],
  空亡: ["空", "主落空、虚耗,与截路同看"],
  孤辰: ["孤", "主孤独感与六亲疏离,男命尤重(男孤女寡)"],
  寡宿: ["孤", "主孤寂,与孤辰同看;夫妻宫见之感情不易稳固"],
  蜚廉: ["是非", "主是非、口舌与小人,宜谨言"],
  破碎: ["耗", "主破损、小耗与破财,宜防琐碎损失"],
  天刑: ["刑", "主刑伤、官非与自我约束,过盛则孤严"],
  阴煞: ["阴", "主暗中小人与阴事,易受暗算或口舌"],
  天哭: ["忧", "主忧伤与愁思,亦有悲悯之心"],
  天虚: ["虚", "主空虚与不实,易患得患失"],
  天使: ["疾", "主病灾与灾厄之使,疾厄宫见之应重视健康"],
  天伤: ["伤", "主损伤与失意,交友宫见之防朋友牵累"],
  天巫: ["吉", "主贵人提拔、财禄与文艺,利发展"],
  华盖: ["孤", "主孤高清逸、艺术宗教之缘,有才华但难合群"],
  解神: ["解", "主化解灾厄,遇凶星可缓其势"],
  年解: ["解", "主一年之解厄"],
};
/* 十二神(取象要点) */
const RD_BOSHI = {
  博士: "聪明、文才,主学识",
  力士: "权势、力量,主权力",
  青龙: "喜庆、财禄",
  小耗: "小破耗",
  将军: "威权、武职",
  奏书: "文书、口才",
  飞廉: "口舌是非",
  喜神: "喜庆之事",
  病符: "疾病、小灾",
  大耗: "较大耗损",
  伏兵: "小人暗伏",
  官府: "官非、公事",
};
const RD_SUI = {
  太岁: "当年的“我”,主自主与冲动",
  晦气: "情绪低落、不顺",
  丧门: "孝服、悲伤事",
  贯索: "牵绊、束缚、官非",
  官符: "官非、口舌",
  小耗: "小耗损",
  大耗: "大耗损",
  龙德: "吉庆化解",
  白虎: "伤灾、孝事",
  天德: "吉星,逢凶化吉",
  吊客: "吊丧、悲事",
  病符: "疾病",
};

const ZW_GROUP_NOUN = {
  self: "心性与福气",
  wealth: "财运与家业",
  work: "事业",
  love: "感情婚姻",
  health: "身体",
  social: "人际往来",
};
function zwStarsOf(p) {
  return p.stars.map((s) => s.n).concat(p.adj || []);
}
function zwHas(p, n) {
  return zwStarsOf(p).includes(n);
}
function zwMain(p) {
  return p.stars.filter((s) => s.t === "main");
}
function zwOpp(zw, b) {
  return zw.pal[mod(b + 6, 12)];
}
function zwWithOpp(zw, p) {
  // 本宫无主星则借对宫
  const m = zwMain(p);
  if (m.length) return { list: m, borrowed: false };
  return { list: zwMain(zwOpp(zw, p.b)), borrowed: true };
}
/* 星曜在某宫的一句解读 */
function zwStarLine(s, palName) {
  const info = RD_STAR[s.n];
  if (!info) return "";
  const P = RD_PAL[palName],
    g = P.g;
  const lens = info[g === "social" ? "soc" : g];
  const brTxt = s.br ? `(${RD_BR[s.br]})` : "";
  let tone = s.br
    ? RD_BRW[s.br] >= 0.3
      ? "力量得以发挥"
      : RD_BRW[s.br] <= -0.6
        ? "力量受制,其负面倾向更易显现"
        : "表现中平"
    : "";
  const pre = P.pre ? P.pre + ":" : "";
  return `${s.n}${brTxt}${s.h ? "化" + s.h : ""}:${pre}${lens}${tone ? `;${tone}` : ""}`;
}
function zwPalScore(zw, p) {
  let sc = 0;
  const notes = [];
  zwMain(p).forEach((s) => {
    sc += s.br ? RD_BRW[s.br] : 0;
    if (s.h === "禄") sc += 1;
    if (s.h === "权") sc += 0.8;
    if (s.h === "科") sc += 0.7;
    if (s.h === "忌") {
      sc -= 1.5;
    }
  });
  p.stars.forEach((s) => {
    if (s.t === "main") return;
    if (["左辅", "右弼", "文昌", "文曲", "天魁", "天钺"].includes(s.n)) {
      sc += 0.5;
      if (s.h === "忌") sc -= 1.2;
      else if (s.h) sc += 0.4;
    } else if (s.n === "禄存") sc += 0.8;
    else if (RD_AUX[s.n] && RD_AUX[s.n].k === "凶") sc -= 1;
  });
  (p.adj || []).forEach((n) => {
    if (["天空", "旬空", "截路", "空亡"].includes(n)) sc -= 0.3;
    if (["天官", "天福", "天德", "月德", "恩光", "天贵"].includes(n)) sc += 0.2;
    if (["孤辰", "寡宿", "天刑", "阴煞", "蜚廉", "破碎"].includes(n)) sc -= 0.2;
  });
  return sc;
}
const zwLevel = (sc) =>
  sc >= 2.6
    ? ["旺", "good"]
    : sc >= 1
      ? ["偏旺", "good"]
      : sc > -1
        ? ["平", "mid"]
        : sc > -2.6
          ? ["偏弱", "bad"]
          : ["弱", "bad"];

/* 格局检测 */
function zwPatterns(zw) {
  const out = [],
    P = zw.pal,
    ming = zw.ming,
    mp = P[ming],
    san = zw.san(ming).map((b) => P[b]);
  const add = (n, t, d) => out.push({ n, t, d });
  const sanNames = [].concat(...san.map((p) => zwStarsOf(p)));
  const inSan = (n) => sanNames.includes(n);
  const hasHua = (h) => san.some((p) => p.stars.some((s) => s.h === h));
  const mainNames = zwMain(mp).map((s) => s.n);
  const nb = [P[mod(ming - 1, 12)], P[mod(ming + 1, 12)]];
  const flank = (a, b) =>
    (zwHas(nb[0], a) && zwHas(nb[1], b)) || (zwHas(nb[0], b) && zwHas(nb[1], a));
  const br = (n) => {
    for (const p of P) {
      const s = p.stars.find((x) => x.n === n);
      if (s) return s.br;
    }
  };
  if (mainNames.includes("紫微") && mainNames.includes("天府"))
    add(
      "紫府同宫",
      "吉",
      "紫微、天府同坐命宫(寅申):尊贵与库财兼备,稳重有格局,宜守成中求发展;怕煞忌冲破。",
    );
  if (mainNames.length === 1 && mainNames[0] === "紫微" && ming === 6)
    add(
      "极向离明",
      "吉",
      "紫微独坐午宫:帝星居正南,气势光明,宜居领导与要职;需辅弼昌曲会照方成大格。",
    );
  if (mainNames.includes("紫微") && inSan("左辅") && inSan("右弼"))
    add("辅弼拱主", "吉", "紫微坐命而三方四正会左辅、右弼:得平辈与贵人多方扶持,能成事业。");
  if (mainNames.includes("紫微") && !inSan("左辅") && !inSan("右弼") && zwMain(mp).length === 1)
    add("孤君", "凶", "紫微独坐而无左右辅佐:有权无人、事必躬亲,宜主动经营人脉与班底。");
  if (inSan("天府") && inSan("天相"))
    add("府相朝垣", "吉", "天府、天相皆入命宫三方四正:稳重有辅弼之助,宜稳步经营、以信誉立身。");
  if (["天机", "太阴", "天同", "天梁"].every(inSan))
    add(
      "机月同梁",
      "平",
      "天机、太阴、天同、天梁会于命宫三方:偏文职、参谋、公务或稳定型职业,适合在组织内发挥;创业需借势。",
    );
  if (["七杀", "破军", "贪狼"].every(inSan))
    add(
      "杀破狼",
      "平",
      "七杀、破军、贪狼会于命宫三方:一生变动大、敢闯敢破,宜开创、竞争型领域;重在有自控力与好时机。",
    );
  if (inSan("太阳") && inSan("太阴")) {
    const a = br("太阳"),
      b = br("太阴"),
      good = (x) => x === "庙" || x === "旺",
      bad = (x) => x === "不" || x === "陷";
    if (good(a) && good(b))
      add("日月并明", "吉", "太阳、太阴皆庙旺且会照命宫:光明磊落又内外兼顾,名利双收的底气。");
    else if (bad(a) && bad(b))
      add(
        "日月反背",
        "凶",
        "太阳、太阴皆落陷而会照命宫:奔波辛苦、不易得力,宜靠专业与坚持逐步扭转。",
      );
  }
  if (flank("太阳", "太阴"))
    add(
      "日月夹命",
      "吉",
      "太阳与太阴分居命宫两侧:得光明与阴柔之气环护,人缘与机遇较好(怕命宫多煞)。",
    );
  if (flank("左辅", "右弼")) add("左右夹命", "吉", "左辅、右弼夹命:一生易得助力,多有人相扶。");
  if (flank("文昌", "文曲")) add("昌曲夹命", "吉", "文昌、文曲夹命:文才、气质与考试运佳。");
  if (flank("天魁", "天钺")) add("魁钺夹命", "吉", "天魁、天钺夹命(“天乙拱命”):关键时有贵人相助。");
  if (flank("擎羊", "陀罗"))
    add("羊陀夹命", "凶", "擎羊、陀罗夹命:身处压力与阻力之间,做事多受牵制,宜稳、忍、后发。");
  if (flank("地空", "地劫"))
    add("空劫夹命", "凶", "地空、地劫夹命:想法多而落地少,财来易散,宜务实。");
  if (flank("火星", "铃星")) add("火铃夹命", "凶", "火星、铃星夹命:性急易躁,突发事件与内耗并存。");
  if (
    (zwHas(nb[0], "禄存") && nb[1].stars.some((s) => s.h === "禄")) ||
    (zwHas(nb[1], "禄存") && nb[0].stars.some((s) => s.h === "禄"))
  )
    add("双禄夹命", "吉", "禄存与化禄夹命宫:财禄环护,资源渠道多。");
  if (inSan("太阳") && inSan("天梁") && inSan("文昌") && (inSan("禄存") || hasHua("禄")))
    add(
      "阳梁昌禄",
      "吉",
      "太阳、天梁、文昌与禄(禄存/化禄)会于三方:传统上利考试、学术、名声与公职。",
    );
  if (hasHua("禄") && hasHua("权") && hasHua("科"))
    add("三奇嘉会", "吉", "化禄、化权、化科会于命宫三方四正:资源、权柄、声誉三者俱备,利于成就。");
  if (inSan("天马") && (inSan("禄存") || hasHua("禄"))) {
    const same = san.some(
      (p) => zwHas(p, "天马") && (zwHas(p, "禄存") || p.stars.some((s) => s.h === "禄")),
    );
    add(
      same ? "禄马交驰" : "禄马会照",
      "吉",
      same
        ? "禄(禄存/化禄)与天马同宫:动中生财,利外出、贸易、流动性行业。"
        : "禄与天马会照命宫三方:财源与机遇多在奔走中得来。",
    );
  }
  const hl = san.find(
    (p) => zwMain(p).some((s) => s.n === "贪狼") && (zwHas(p, "火星") || zwHas(p, "铃星")),
  );
  if (hl) {
    const h = zwHas(hl, "火星") ? "火贪格" : "铃贪格";
    add(
      h,
      "吉",
      `贪狼与${h[0]}星同宫于${hl.name}:传统上称“暴发”之格,机遇来得突然、变化快,宜把握时机但忌贪多;需庙旺、无空劫破坏方成。`,
    );
  }
  if (mainNames.includes("巨门") && (ming === 0 || ming === 6))
    add("石中隐玉", "吉", "巨门坐命子午:才华深藏、厚积薄发,宜专业深耕;逢化禄化权更显。");
  if (mainNames.includes("太阳") && ming === 3)
    add("日照雷门", "吉", "太阳坐命卯宫:朝阳升起,光明进取,名声易显。");
  if (mainNames.includes("太阴") && ming === 11)
    add("月朗天门", "吉", "太阴坐命亥宫:月华入天门,清雅富足,重家宅与积蓄。");
  if (mainNames.includes("太阳") && ming === 6)
    add("日丽中天", "吉", "太阳坐命午宫:日至中天,气势鼎盛,名望与事业心强(怕操劳)。");
  if (mainNames.includes("紫微") && mainNames.includes("贪狼"))
    add("桃花犯主", "平", "紫微、贪狼同宫(卯酉):才艺与魅力出众,但感情与欲望需自律。");
  if (mainNames.includes("武曲") && mainNames.includes("贪狼"))
    add("武贪同行", "平", "武曲、贪狼同宫(丑未):传统说“先贫后富”,大器晚成,重在耐心与积累。");
  if (mainNames.includes("廉贞") && mainNames.includes("贪狼"))
    add("廉贪同宫", "平", "廉贞、贪狼同宫(巳亥):情感欲望与才华并存,桃花重,宜守规则。");
  if (mainNames.includes("天机") && mainNames.includes("巨门"))
    add("机巨同临", "平", "天机、巨门同宫(卯酉):聪明善辩、思虑深,易多疑,宜专业化。");
  if (mainNames.includes("巨门") && mainNames.includes("太阳"))
    add("巨日同宫", "平", "巨门、太阳同宫(寅申):口才与名声并见,寅宫较佳,须防口舌与操劳。");
  if (!zwMain(mp).length)
    add(
      "命无正曜",
      "平",
      `命宫无主星,借对宫(${zwOpp(zw, ming).name})主星入座论,自我定位较依赖环境,力量约减半;三方四正的吉煞更关键。`,
    );
  const kongjie = ["地空", "地劫"].filter((n) => zwHas(mp, n));
  if (kongjie.length)
    add(
      "空劫入命",
      "凶",
      `${kongjie.join("、")}入命:想法超前而落地偏弱,得失反复;若主星庙旺且见吉化,亦可转为独特创意。`,
    );
  else if (inSan("地空") || inSan("地劫"))
    add("空劫会照", "平", "地空/地劫会照命宫三方:财与事业中需防落空或耗损。");
  ["擎羊", "陀罗", "火星", "铃星"].forEach((n) => {
    if (zwHas(mp, n))
      add(
        n + "入命",
        "凶",
        {
          擎羊: "擎羊入命:个性刚烈、主见强,竞争力足,注意冲突与意外伤害;庙位(辰戌丑未)尤可为决断力。",
          陀罗: "陀罗入命:做事迟缓执着,易反复拖延,但有耐力,宜稳扎稳打。",
          火星: "火星入命:急性子、爆发力强,情绪来去快,宜控制冲动。",
          铃星: "铃星入命:外静内烈,心思阴沉,暗耗多,宜疏导情绪。",
        }[n],
      );
  });
  // 化忌逐宫检查
  P.forEach((p) => {
    const ji = p.stars.find((s) => s.h === "忌");
    if (ji) {
      const prev = P[mod(p.b - 1, 12)],
        next = P[mod(p.b + 1, 12)];
      if (
        (zwHas(prev, "擎羊") && zwHas(next, "陀罗")) ||
        (zwHas(prev, "陀罗") && zwHas(next, "擎羊"))
      )
        add(
          "羊陀夹忌",
          "凶",
          `${p.name}的${ji.n}化忌被擎羊、陀罗夹持:该宫所主之事阻力大、易反复,需特别用心处理。`,
        );
    }
  });
  const jiP = P.find((p) => p.stars.some((s) => s.h === "忌"));
  if (
    jiP &&
    [zw.ming, mod(zw.ming + 4, 12), mod(zw.ming + 8, 12), mod(zw.ming + 6, 12)].includes(jiP.b)
  )
    add(
      "忌入命三方",
      "平",
      `生年化忌(${jiP.stars.find((s) => s.h === "忌").n})落在${jiP.name},属命宫三方四正:此星所主之事是一生的“功课”与执着点,认真面对即可转为专精。`,
    );
  return out;
}
/* 生年四化落宫 */
function zwSihuaMap(zw) {
  const out = [];
  ["禄", "权", "科", "忌"].forEach((h) => {
    let at = null,
      star = null;
    zw.pal.forEach((p) =>
      p.stars.forEach((s) => {
        if (s.h === h) {
          at = p;
          star = s;
        }
      }),
    );
    if (at) {
      const P = RD_PAL[at.name];
      out.push({
        h,
        star: star.n,
        pal: at.name,
        b: at.b,
        t: `${star.n}化${h}入${at.name}:${P.noun}方面${RD_HUA[h]}。${h === "忌" ? `${star.n}所主(${RD_STAR[star.n] ? RD_STAR[star.n].tag : ""})是该宫的敏感处。` : `${star.n}所主(${RD_STAR[star.n] ? RD_STAR[star.n].tag : ""})在此得力。`}`,
      });
    }
  });
  return out;
}
/* 身宫含义 */
const RD_SHEN = {
  命宫: "身宫与命宫同宫:先天与后天一致,主观意志决定人生,性格稳定。",
  夫妻: "身宫落夫妻:感情婚姻是后天生活重心,配偶影响大。",
  财帛: "身宫落财帛:后天重视赚钱与物质保障,财是奋斗动力。",
  迁移: "身宫落迁移:后天重外出、环境与人际,适合走动型、对外型发展。",
  官禄: "身宫落官禄:后天以事业为重,成就感来自工作。",
  福德: "身宫落福德:后天重精神享受与内心满足,爱思考、讲求生活品质。",
  田宅: "身宫落田宅:后天重家庭与置业,以家为本。",
  子女: "身宫落子女:后天重子女缘与创造力。",
  兄弟: "身宫落兄弟:后天重同辈伙伴与合作。",
  疾厄: "身宫落疾厄:后天需重视健康与身心调适。",
  交友: "身宫落交友:后天重朋友与人脉网络。",
  父母: "身宫落父母:后天重文书、学业与长辈提携。",
};
const RD_JU = {
  2: "水二局(2岁起大限,发福较早,性偏灵动)",
  3: "木三局(3岁起大限)",
  4: "金四局(4岁起大限)",
  5: "土五局(5岁起大限)",
  6: "火六局(6岁起大限,大运展开较晚)",
};

/* 主入口 */
function ziweiReading(zw, lunar, gender, nowYear) {
  const sec = [],
    sum = [];
  const mp = zw.pal[zw.ming],
    sp = zw.pal[zw.shen];
  const wm = zwWithOpp(zw, mp);
  // 1 总纲
  const core = [];
  const mainTxt = wm.list
    .map((s) => `${s.n}${s.br ? `(${RD_BR[s.br]})` : ""}${s.h ? "化" + s.h : ""}`)
    .join("、");
  core.push({
    k: "命宫",
    t: `命宫在${ZHI[zw.ming]}${wm.borrowed ? `,无主星,借对宫${mainTxt || "(无)"}` : `,坐${mainTxt}`}。${wm.list.length ? wm.list.map((s) => (RD_STAR[s.n] ? `${s.n}属${RD_STAR[s.n].wx},${RD_STAR[s.n].qual}——${RD_STAR[s.n].pos}。其不利面:${RD_STAR[s.n].neg}。` : "")).join("") : ""}`,
    basis: "命宫主星、亮度",
  });
  core.push({
    k: "五行局",
    t: `${RD_JU[zw.ju]}。命宫纳音${zw.nyName},命主${zw.mingStar}、身主${zw.shenStar}——命主偏向先天禀赋,身主偏向后天行为方式。`,
    basis: "五行局、命身主",
  });
  core.push({
    k: "身宫",
    t: `身宫在${ZHI[zw.shen]},落于${sp.name}。${RD_SHEN[sp.name]}`,
    basis: "身宫所在宫位",
  });
  core.push({
    k: "阴阳与大限",
    t: `生于${lunar.year}年(${gz(lunar.year - 4)}),${zw.fwd ? "阳男阴女,大限顺行" : "阴男阳女,大限逆行"}。大限每十年转一宫,${zw.ju}岁起运,由命宫依方向推行。`,
    basis: "年干阴阳、性别",
  });
  sec.push({ title: "命盘总纲", items: core });
  // 2 四化
  const sh = zwSihuaMap(zw);
  sec.push({
    title: `生年四化(${zw.sihua.join(" ")})`,
    items: sh.map((x) => ({
      k: `化${x.h}·${x.pal}`,
      t: x.t,
      tone: x.h === "忌" ? "bad" : "good",
      basis: `${gz(lunar.year - 4)}年${"甲乙丙丁戊己庚辛壬癸"[zw.ys]}干四化`,
    })),
  });
  // 3 格局
  const pats = zwPatterns(zw);
  sec.push({
    title: "格局",
    items: pats.length
      ? pats.map((x) => ({
          k: x.n,
          t: x.d,
          tone: x.t === "吉" ? "good" : x.t === "凶" ? "bad" : "mid",
          basis: "命宫三方四正/邻宫",
        }))
      : [
          {
            k: "未见典型成格",
            t: "命宫三方四正未构成常见的典型格局,以逐宫星曜组合及吉煞多寡论较宜。",
            tone: "mid",
          },
        ],
    note: "格局以命宫三方四正为主(本宫、对宫、财帛、官禄),条件取通行口诀的宽口径判断,成格与否仍需结合亮度与煞忌破格。",
  });
  // 4 十二宫
  const pal = [];
  const order = [
    "命宫",
    "兄弟",
    "夫妻",
    "子女",
    "财帛",
    "疾厄",
    "迁移",
    "交友",
    "官禄",
    "田宅",
    "福德",
    "父母",
  ];
  order.forEach((nm, i) => {
    const p = zw.pal[mod(zw.ming - i, 12)],
      P = RD_PAL[nm],
      w = zwWithOpp(zw, p),
      sc = zwPalScore(zw, p),
      lv = zwLevel(sc);
    const lines = [];
    if (w.list.length) {
      lines.push(
        w.borrowed
          ? `本宫无主星,借对宫(${zwOpp(zw, p.b).name}·${ZHI[mod(p.b + 6, 12)]})之${w.list.map((s) => s.n).join("、")}入座论,力度约减半,但仍可参照其星性:`
          : "",
      );
      w.list.forEach((s) => lines.push(zwStarLine(s, nm)));
    } else lines.push("本宫及对宫皆无主星,以三方四正及辅佐煞曜为主论,整体较“空”,易随环境而变。");
    const fu = p.stars.filter((s) => s.t !== "main");
    fu.forEach((s) => {
      const a = RD_AUX[s.n];
      if (!a) return;
      const noun = P.noun;
      if (a.k === "吉")
        lines.push(`${s.n}${s.h ? "化" + s.h : ""}入${nm}:${a.txt};${noun}多得助益。`);
      else if (a.k === "动") lines.push(`${s.n}入${nm}:${a.txt}。`);
      else lines.push(`${s.n}${s.h ? "化" + s.h : ""}入${nm}:${a.txt};${noun}需防${a.risk}。`);
    });
    const adj = (p.adj || []).filter((n) => RD_ADJ[n]);
    if (adj.length)
      lines.push(
        "杂曜:" +
          adj.map((n) => `${n}(${RD_ADJ[n][1].split(",")[0].replace(/^主/, "")})`).join("、") +
          "。",
      );
    const cnt = p.stars.filter((s) => s.h);
    cnt.forEach((s) => {});
    // 三方四正简述
    const san = zw
      .san(p.b)
      .slice(1)
      .map((b) => zw.pal[b]);
    const good = san.reduce(
        (a, q) =>
          a + q.stars.filter((s) => s.t !== "main" && RD_AUX[s.n] && RD_AUX[s.n].k === "吉").length,
        0,
      ),
      bad = san.reduce(
        (a, q) =>
          a + q.stars.filter((s) => s.t !== "main" && RD_AUX[s.n] && RD_AUX[s.n].k === "凶").length,
        0,
      );
    const jiIn = san.filter((q) => q.stars.some((s) => s.h === "忌")).map((q) => q.name);
    lines.push(
      `三方四正(${san.map((q) => q.name).join("、")}):吉星${good}颗、煞星${bad}颗${jiIn.length ? `;化忌在${jiIn.join("、")}` : ""}。`,
    );
    pal.push({
      k: `${nm}·${ZHI[p.b]}${GAN[p.stem]}`,
      t: lines.filter(Boolean).join("\n"),
      tone: lv[1],
      badge: `${P.th}｜倾向:${lv[0]}`,
      basis: `本宫得分 ${sc.toFixed(1)}`,
      pal: nm,
    });
  });
  sec.push({
    title: "十二宫逐宫解读",
    items: pal,
    collapse: true,
    note: "倾向由星曜亮度、四化、吉煞多寡机械累加得出,仅反映“该宫星曜组合的顺逆”,不等于事情结果。",
  });
  // 5 辅佐煞曜
  const aux = [];
  zw.pal.forEach((p) =>
    p.stars.forEach((s) => {
      if (s.t === "main") return;
      const a = RD_AUX[s.n];
      if (!a) return;
      const P = RD_PAL[p.name];
      aux.push({
        k: `${s.n}${s.h ? "化" + s.h : ""} · ${p.name}(${ZHI[p.b]})${s.br ? "·" + RD_BR[s.br] : ""}`,
        t: `${a.txt}。落${p.name}:${a.k === "凶" ? `${P.noun}方面须留意${a.risk}` : a.k === "动" ? `${P.noun}方面多变动与奔走` : `${P.noun}方面较易得到助力`}。${s.h ? `并化${s.h}:${RD_HUA[s.h]}。` : ""}`,
        tone: a.k === "吉" ? "good" : a.k === "凶" ? "bad" : "mid",
        basis: a.g,
      });
    }),
  );
  sec.push({ title: "辅佐煞曜(六吉·六煞·禄马)", items: aux });
  // 6 杂曜/神煞
  const adjItems = [];
  zw.pal.forEach((p) =>
    (p.adj || []).forEach((n) => {
      const a = RD_ADJ[n];
      if (!a) return;
      const P = RD_PAL[p.name];
      adjItems.push({
        k: `${n} · ${p.name}(${ZHI[p.b]})`,
        t: `${a[1]}。在${p.name}时,影响集中于${P.noun}。`,
        tone: [
          "吉",
          "贵",
          "福",
          "解厄",
          "解",
          "才智",
          "才艺",
          "名位",
          "桃花·喜",
          "贵人",
          "寿",
        ].includes(a[0])
          ? "good"
          : ["桃花"].includes(a[0])
            ? "mid"
            : ["孤", "空", "疾", "刑", "耗", "是非", "阴", "忧", "虚", "伤"].includes(a[0])
              ? "bad"
              : "mid",
        basis: `类别:${a[0]}`,
      });
    }),
  );
  sec.push({
    title: "杂曜神煞(38曜)",
    items: adjItems,
    collapse: true,
    note: "杂曜为辅助之象,其力量小于主星与六吉六煞;传统上只在命宫、身宫及其三方会照时才较为显著。",
  });
  // 7 十二神
  const tw = zw.san(zw.ming).map((b) => zw.pal[b]);
  const g12 = [];
  [
    ["博士十二神", (p) => p.boshi, RD_BOSHI],
    ["岁前十二神", (p) => p.sui, RD_SUI],
  ].forEach(([title, fn, tab]) => {
    const rows = tw.map((p) => `${p.name}:${fn(p)}(${tab[fn(p)] || ""})`);
    g12.push({
      k: title,
      t: `命宫三方四正:${rows.join(";")}。`,
      basis: title === "博士十二神" ? "以禄存起,依阴阳男女顺逆" : "以太岁(年支)起,顺行",
    });
  });
  const jq = tw.map((p) => `${p.name}:${p.jiang}`);
  g12.push({
    k: "将前十二神",
    t: `命宫三方四正:${jq.join(";")}。将星主权威,华盖主孤高,咸池主桃花,劫煞灾煞天煞主外来损耗。`,
    basis: "以年支三合局起",
  });
  const own = mp.sui;
  g12.push({
    k: "命宫岁前神",
    t: `命宫坐${own}(${RD_SUI[own] || ""});命宫博士系${mp.boshi}(${RD_BOSHI[mp.boshi] || ""}),将前系${mp.jiang}。`,
    basis: "命宫本宫",
  });
  sec.push({
    title: "三个十二神(要点)",
    items: g12,
    note: "十二神多用于细断年运与神煞,不作主体论断。",
  });
  // 8 大限
  const age = nowYear ? nowYear - lunar.year + 1 : 0;
  if (age >= 1) {
    const dxP = zw.pal.find(
      (p) => age >= p.dx[0] && age <= p.dx[1] + 9 && age >= p.dx[0] && age <= p.dx[1],
    );
    if (dxP) {
      const stemS = GAN[dxP.stem],
        hs = SIHUA[dxP.stem];
      const lab = ["禄", "权", "科", "忌"];
      const fly = hs.map((nm, i) => {
        let at = null;
        zw.pal.forEach((p) =>
          p.stars.forEach((s) => {
            if (s.n === nm) at = p;
          }),
        );
        return `${nm}化${lab[i]}入${at ? at.name : "—"}`;
      });
      const w = zwWithOpp(zw, dxP);
      sec.push({
        title: `当前大限(${dxP.dx[0]}–${dxP.dx[1]}岁,虚岁${age})`,
        items: [
          {
            k: "大限所在宫",
            t: `大限落于本命${dxP.name}(${ZHI[dxP.b]}):这十年的重心偏向“${RD_PAL[dxP.name].th}”。宫内${w.list.length ? `${w.borrowed ? "借" : ""}主星${w.list.map((s) => s.n + (s.br ? "(" + RD_BR[s.br] + ")" : "")).join("、")}` : "无主星"},本宫倾向:${zwLevel(zwPalScore(zw, dxP))[0]}。`,
            basis: "大限起止岁数",
          },
          {
            k: "大限四化",
            t: `${stemS}干四化:${fly.join(";")}。大限化禄所入之宫是此十年机遇所在,化忌所入之宫是需谨慎的功课。`,
            basis: "大限宫天干",
          },
        ],
        note: "仅示大限层面;流年请参见下方“流年命宫与流年四化”表。",
      });
    }
  }
  // 总评
  const good = pats.filter((x) => x.t === "吉").length,
    bad = pats.filter((x) => x.t === "凶").length;
  const mp2 = zwPalScore(zw, mp),
    lv2 = zwLevel(mp2);
  sum.push({
    tone: lv2[1],
    text: `命宫${ZHI[zw.ming]}(${
      mp.stars
        .filter((s) => s.t === "main")
        .map((s) => s.n)
        .join("、") || "无主星借对宫"
    }),命宫星曜倾向:${lv2[0]};格局吉${good}、凶${bad}。`,
  });
  const strong = [...zw.pal]
    .map((p, i) => ({ p, sc: zwPalScore(zw, p) }))
    .sort((a, b) => b.sc - a.sc);
  sum.push({
    tone: "good",
    text: `星曜较得力的宫位:${strong
      .slice(0, 3)
      .map((x) => x.p.name)
      .join("、")};需要更多用心的宫位:${strong
      .slice(-3)
      .reverse()
      .map((x) => x.p.name)
      .join("、")}。`,
  });
  if (sh.length)
    sum.push({
      tone: "mid",
      text: `四化重点:${sh.map((x) => `${x.star}化${x.h}入${x.pal}`).join(";")}。`,
    });
  return { summary: sum, sections: sec };
}

/* =====================================================================
   八字 · 命局解读引擎(规则化)
   依据:《子平真诠》《滴天髓》《渊海子平》《三命通会》通行章法:日主强弱、月令取格、十神生克制化、六亲宫位、神煞。
   方法:量化十神分布 → 检测经典组合(官印相生、伤官见官、枭神夺食…)→ 分宫位/分主题成段;所有论点附“依据”。
   声明:命理学派繁多,同一命局在不同流派下取用可差异很大;以下是通行口径的结构性描述,不是对个人命运的断言。
   ===================================================================== */
const BZ_DM = {
  甲: [
    "参天大树",
    "正直上进,有担当与领导欲,不喜低头;宜直中带曲、学会变通",
    "宜:主动开拓、带团队;忌:固执硬碰",
  ],
  乙: [
    "花草藤蔓",
    "柔韧灵活,善协调与借力,适应力强;外柔内韧,有时缺决断",
    "宜:借势而行、合作共赢;忌:依赖、犹豫",
  ],
  丙: [
    "太阳之火",
    "热情外向,光明坦荡,重面子、爱表现,乐于照亮他人",
    "宜:公众舞台、传播;忌:急躁、耗散",
  ],
  丁: [
    "灯烛之火",
    "温和细腻,外柔内明,专注有心思,重情感与礼数",
    "宜:深耕一事、文化技艺;忌:多虑内耗",
  ],
  戊: [
    "高山城墙",
    "稳重厚实、讲信用,能承载责任,但偏固执、变通慢",
    "宜:守成、管理、稳健经营;忌:因循保守",
  ],
  己: [
    "田园之土",
    "包容细腻,善培育与照顾,谨慎多思,常默默承担",
    "宜:培养人才、后勤统筹;忌:优柔、多疑",
  ],
  庚: [
    "刀剑顽铁",
    "刚毅果决、重义气,执行力强,直来直去;需锻炼(遇火成器)",
    "宜:攻坚、竞争;忌:过刚易折",
  ],
  辛: [
    "珠玉美饰",
    "精致敏感、自尊心强,追求品质与格调,怕被轻视",
    "宜:精品、审美、专业化;忌:挑剔、情绪化",
  ],
  壬: [
    "江河大海",
    "聪明大气、包容流动,思路开阔,不拘小节;意志力受情绪影响",
    "宜:谋略、贸易、跨界;忌:飘忽、无定",
  ],
  癸: [
    "雨露之水",
    "细腻内敛、聪慧善感,直觉强,擅长默默滋养;易多愁",
    "宜:研究、策划、幕后;忌:悲观、缺行动",
  ],
};
const BZ_TG = {
  比肩: {
    g: "同类",
    pos: "自信独立、有朋友与同辈助力,合作稳",
    neg: "固执己见、竞争分财、不善借力",
    ps: "兄弟朋友、同事",
  },
  劫财: {
    g: "同类",
    pos: "行动力强、敢闯敢拼、义气",
    neg: "冲动争胜、破财、合作中易起争执",
    ps: "竞争者、同辈",
  },
  食神: {
    g: "食伤",
    pos: "温和知足、才艺口福、思维灵动、有福气",
    neg: "安逸怠惰、想多做少",
    ps: "才华、享受、子女(女)",
  },
  伤官: {
    g: "食伤",
    pos: "才华出众、创意犀利、不拘一格",
    neg: "恃才傲物、口舌是非、与权威冲突",
    ps: "才华表达、子女(女)",
  },
  偏财: {
    g: "财",
    pos: "善把握机会、外向大方、人缘广、偏财运",
    neg: "散漫花销、投机波动、感情不专",
    ps: "父亲(男看)、外财、情人",
  },
  正财: {
    g: "财",
    pos: "踏实勤俭、重稳定收入、责任心强",
    neg: "过于保守、斤斤计较、格局偏小",
    ps: "妻(男看)、正当收入",
  },
  七杀: {
    g: "官杀",
    pos: "魄力、抗压、敢担当、有威严",
    neg: "压力大、急躁、冲突与小人",
    ps: "压力、对手、夫(女看,偏)",
  },
  正官: {
    g: "官杀",
    pos: "守规矩、有责任、重名誉、适合体制与管理",
    neg: "拘谨保守、自我压抑",
    ps: "夫(女看)、上司、职位",
  },
  偏印: {
    g: "印",
    pos: "独特悟性、偏门技艺、研究与直觉",
    neg: "孤僻多疑、想法偏、易钻牛角尖",
    ps: "偏门学问、继母",
  },
  正印: {
    g: "印",
    pos: "仁厚好学、贵人庇荫、有学历与声誉",
    neg: "依赖心重、缺魄力、多虑",
    ps: "母亲、长辈、学业",
  },
};
const BZ_PIL = [
  { n: "年柱", age: "祖上、早年(约 1–16 岁)", ext: "家庭出身、祖辈、外部环境、早年际遇" },
  { n: "月柱", age: "父母兄弟、青年(约 17–32 岁)", ext: "父母、兄弟、事业宫、社会环境(月令最重)" },
  { n: "日柱", age: "自身与配偶、中年(约 33–48 岁)", ext: "自己(日干)与配偶(日支),命局核心" },
  { n: "时柱", age: "子女下属、晚年(约 49 岁后)", ext: "子女、下属、晚年归宿、事业收成" },
];
const BZ_ORG = {
  木: "肝、胆、筋、目",
  火: "心、小肠、血脉、舌",
  土: "脾、胃、肌肉、口",
  金: "肺、大肠、皮肤、呼吸道",
  水: "肾、膀胱、骨、耳、泌尿",
};
const BZ_IND = {
  木: "教育文化、出版、林业园艺、服装、中医药",
  火: "能源电子、传媒广告、餐饮、光电、演艺",
  土: "房地产、建筑、农业、仓储中介、管理",
  金: "金融、机械五金、法律、汽车、军警",
  水: "贸易物流、水产旅游、信息通信、咨询研究",
};
const BZ_GJ = {
  正官格: [
    "官星当令,主守规矩、重名誉,宜体制或规范化组织",
    "成:财生官、印护官、官旺身强;破:伤官见官、官杀混杂、刑冲官星",
  ],
  七杀格: [
    "七杀当令,魄力强、压力大、有开拓性",
    "成:食神制杀、印化杀(杀印相生);破:身弱杀重无制、财党杀",
  ],
  正印格: ["印星当令,重学识、名誉与贵人,性温和稳重", "成:官印相生、身弱得印;破:财坏印、印重身滞"],
  偏印格: ["偏印当令,悟性独特、偏门技艺,思维新奇", "成:杀印相生、偏印化杀;破:枭神夺食(偏印克食神)"],
  食神格: ["食神当令,才艺福气、性情温厚,重生活品质", "成:食神生财、身强泄秀;破:偏印夺食、食神被克"],
  伤官格: [
    "伤官当令,才华锋芒、创意强,不受拘束",
    "成:伤官生财、伤官佩印(身弱);破:伤官见官、无财印而身弱",
  ],
  正财格: ["财星当令,务实勤勉、重积累,做事稳当", "成:身强任财、财官相生;破:比劫夺财、身弱不胜财"],
  偏财格: ["偏财当令,机会感强、善经营人脉与资源", "成:身强财旺、食伤生财;破:比劫劫财、身弱财多"],
  建禄格: ["日主得月令之禄,自立自强,须借财官成局", "成:财官透出得用;破:比劫重重无财官,或群比争财"],
  阳刃格: ["月令为日主之刃,刚烈果断,力量极足", "成:官杀制刃(刃杀相济);破:无制则冲动招灾"],
  月劫格: ["月令为日主之劫(阴干),同类力量强,须泄或制", "成:食伤泄秀、财官得用;破:比劫夺财"],
};
function bzTenGods(bz) {
  const dm = bz.dm,
    tg = {},
    put = (g, w) => {
      const n = shishen(dm, g);
      tg[n] = (tg[n] || 0) + w;
    };
  const POSW = [0.8, 1.6, 1.3, 1];
  bz.pill.forEach((p, i) => {
    if (i !== 2) put(p.s, i === 1 ? 1.2 : 1);
    CANG[p.b].forEach((g, k) => put(g, [1, 0.5, 0.3][k] * POSW[i]));
  });
  return tg;
}
const bzG = (tg, names) => names.reduce((a, n) => a + (tg[n] || 0), 0);
function bzStemHas(bz, name) {
  return bz.pill.some((p, i) => i !== 2 && shishen(bz.dm, p.s) === name);
}
function bzPatterns(bz, D, tg) {
  const out = [],
    has = (n) => (tg[n] || 0) >= 0.9,
    vis = (...ns) => ns.some((n) => bzStemHas(bz, n)),
    strong = D.st.level === "偏强" || D.st.level === "极强",
    weak = D.st.level === "偏弱" || D.st.level === "极弱";
  const add = (n, t, d) => out.push({ n, t, d });
  const guan = tg.正官 || 0,
    sha = tg.七杀 || 0,
    yin = bzG(tg, ["正印", "偏印"]),
    cai = bzG(tg, ["正财", "偏财"]),
    shi = tg.食神 || 0,
    shang = tg.伤官 || 0,
    bi = bzG(tg, ["比肩", "劫财"]);
  if (guan >= 1 && sha >= 1 && vis("正官", "七杀"))
    add(
      "官杀混杂",
      "凶",
      "正官、七杀并见:压力与责任来源多元,方向易摇摆、是非较多;得食伤制杀留官或印化,则可转清。",
    );
  if (shang >= 1 && guan >= 1 && vis("伤官", "正官"))
    add(
      "伤官见官",
      "凶",
      "伤官与正官相见:才华与规矩相冲,易与上司/规则起冲突;得印制伤或财通关(伤官生财、财生官)可缓解。",
    );
  if ((tg.偏印 || 0) >= 1 && (tg.食神 || 0) >= 1 && vis("偏印", "食神"))
    add(
      "枭神夺食",
      "凶",
      "偏印(枭)克制食神:才华与福气易被“想太多”压制,行动力与享受感下降;有偏财制枭则可解。",
    );
  if (yin >= 1.2 && (guan >= 1.2 || sha >= 1.2) && vis("正印", "偏印") && vis("正官", "七杀")) {
    add(
      sha > guan ? "杀印相生" : "官印相生",
      "吉",
      `${sha > guan ? "七杀" : "正官"}生印、印生身:压力转为助力,利于学识、名誉与职位,稳步上升。`,
    );
  }
  if (shi + shang >= 1.4 && cai >= 1.4 && vis("食神", "伤官") && vis("正财", "偏财"))
    add("食伤生财", "吉", "食神/伤官生财:靠才华与手艺变现,利于技能型、创意型或服务型营生。");
  if (cai >= 1.4 && guan + sha >= 1.4 && vis("正财", "偏财") && vis("正官", "七杀"))
    add("财官相生", "吉", "财生官杀:资源通向地位,事业与收入互相促进,宜身强方能承接。");
  if (bi >= 2.4 && cai >= 1 && vis("比肩", "劫财"))
    add("比劫争财", "凶", "同类力量重而财星显:合作分利、竞争与破财风险,宜明账目、分股权、少担保。");
  if (cai >= 2.4 && weak)
    add("财多身弱", "凶", "财星旺而日主偏弱:机会多但担不起,易劳而少获;宜借印比扶身、不宜贪大。");
  if (yin >= 2.6 && !weak)
    add("印多身滞", "平", "印星过重:依赖与思虑多,行动偏迟,宜以食伤泄秀、以财制印以促行动。");
  if (shi + shang >= 2.6 && weak)
    add("食伤泄身", "平", "食伤旺而日主弱:精力才华外泄,易疲惫,需印星补给与休整。");
  if (sha >= 1.6 && !bzStemHas(bz, "食神") && yin < 0.9 && weak)
    add(
      "杀重无制",
      "凶",
      "七杀重而身弱又无食神制、印星化:压力大、易遇小人与突发事件,宜借贵人与稳健策略。",
    );
  const nb = D.gj.name;
  if (nb === "阳刃格" && guan + sha < 0.9)
    add("刃无官杀", "凶", "阳刃当令而无官杀制约:刚烈易冲动,宜以规则与纪律自制。");
  if ((tg.正财 || 0) >= 0.9 && (tg.偏财 || 0) >= 0.9)
    add("财星混杂", "平", "正偏财并见:财路多元但心易散;男命感情线也宜专一。");
  return out;
}
function bzDiff(a) {
  return a.filter((x, i) => a.indexOf(x) === i);
}
const BZ_SS_DESC = {
  天乙贵人: "遇难有人相助、逢凶化吉,主贵人缘",
  太极贵人: "悟性好、好学,偏玄学宗教之缘",
  文昌贵人: "聪慧、利读书考试与文字",
  禄神: "衣食有根、自立能力强",
  羊刃: "力量过盛而刚,宜制不宜逢冲,有决断亦有伤灾之嫌",
  驿马: "奔波迁动,利外出、变动、外贸交通",
  桃花: "魅力与人缘,亦主感情波折",
  华盖: "孤高清逸,利艺术宗教研究,不易合群",
  将星: "领导力、统御力",
  劫煞: "突发破耗、外力扰动",
  孤辰: "孤独感、六亲缘薄(男重)",
  寡宿: "孤寂感(女重),感情需主动经营",
  红鸾: "婚恋喜事、异性缘",
  天喜: "喜庆之象",
  月德贵人: "福德庇荫,逢难化解",
  天德贵人: "天赐福荫,降低灾厄",
  魁罡日: "性刚决断、极端,大起大落",
  空亡: "力量落空、虚而不实,填实或逢冲则出空",
};
function bzReading(bz, D, gender, lunar, nowYear) {
  const sec = [],
    sum = [];
  const dm = GAN[bz.dm],
    dw = GAN_WX[bz.dm],
    wxn = WXN[dw],
    tg = bzTenGods(bz);
  const M = bz.pill[1];
  const ratioPct = Math.round(D.st.ratio * 100);
  // 1 日主画像
  const P = BZ_DM[dm];
  const items1 = [
    { k: `日主 ${dm}${wxn}`, t: `${dm}${wxn}如${P[0]}:${P[1]}。${P[2]}。`, basis: "日干取象" },
    {
      k: "生于月令",
      t: `生于${ZHI[M.b]}月(${GAN[M.s]}${ZHI[M.b]}),日主${D.st.season}令(${D.st.deLing ? "得令" : "失令"})。得令则根基在月令、力量稳;失令则需靠年日时地支的通根与天干帮扶。`,
      basis: "月令旺相休囚死",
    },
    {
      k: "强弱",
      t: `同类与生扶力量约占 ${ratioPct}%,判为「${D.st.level}」。${D.st.level === "偏强" || D.st.level === "极强" ? "自主性强、承压力足,适合承担;须有出口(食伤、财、官杀)泄耗,否则易固执或用力过猛。" : D.st.level === "偏弱" || D.st.level === "极弱" ? "能量偏薄,更依赖环境与贵人;宜借印比扶身,避免过度消耗和承担超出能力的责任。" : "力量相对平衡,顺势而为,重点看运势与用神是否到位。"}`,
      basis: "四柱位置加权(月支最重)",
    },
    {
      k: "格局",
      t: `${D.gj.name}。${BZ_GJ[D.gj.name] ? BZ_GJ[D.gj.name][0] : ""}${BZ_GJ[D.gj.name] ? "\n" + BZ_GJ[D.gj.name][1] : ""}。${D.gj.note}。`,
      basis: "月令藏干取格",
    },
    {
      k: "取用",
      t: `偏向取用:${D.xy.favor.map((x) => WXN[x]).join("、")};宜抑:${D.xy.avoid.map((x) => WXN[x]).join("、") || "无明显"}。${D.xy.notes.join("")}`,
      tone: "good",
      basis: "扶抑 + 调候",
    },
  ];
  {
    const cg = typeof congGeNote === "function" ? congGeNote(bz, D) : null;
    if (cg) items1.push(cg);
  }
  sec.push({ title: "日主与格局", items: items1 });
  // 2 十神结构
  const order = ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"];
  const tgItems = order
    .filter((n) => (tg[n] || 0) > 0)
    .sort((a, b) => tg[b] - tg[a])
    .map((n) => {
      const x = BZ_TG[n],
        w = tg[n];
      const lv = w >= 2.2 ? "过旺" : w >= 1.2 ? "有力" : w >= 0.6 ? "适度" : "偏弱";
      return {
        k: `${n} · ${w.toFixed(1)}(${lv})`,
        t: `${x.ps}。适度时:${x.pos};过旺时:${x.neg}。`,
        tone: "mid",
        basis: "天干 + 地支藏干加权",
      };
    });
  const missing = order.filter((n) => !(tg[n] > 0));
  const groups = {
    比劫: bzG(tg, ["比肩", "劫财"]),
    食伤: bzG(tg, ["食神", "伤官"]),
    财: bzG(tg, ["正财", "偏财"]),
    官杀: bzG(tg, ["正官", "七杀"]),
    印: bzG(tg, ["正印", "偏印"]),
  };
  const gtxt = Object.entries(groups)
    .map(([k, v]) => `${k}${v.toFixed(1)}`)
    .join(" · ");
  sec.push({
    title: "十神结构",
    items: [
      {
        k: "五类力量",
        t: `${gtxt}。${(() => {
          const e = Object.entries(groups).sort((a, b) => b[1] - a[1]);
          return `最重为「${e[0][0]}」,最轻为「${e[4][0]}」。`;
        })()}${missing.length ? `\n四柱不见:${missing.join("、")}(不见者未必无,多为该主题“不主动、随运而现”)。` : ""}`,
        basis: "汇总",
      },
    ].concat(tgItems),
    collapse: true,
  });
  // 3 组合
  const pats = bzPatterns(bz, D, tg);
  sec.push({
    title: "经典组合(成格/破格)",
    items: pats.length
      ? pats.map((x) => ({
          k: x.n,
          t: x.d,
          tone: x.t === "吉" ? "good" : x.t === "凶" ? "bad" : "mid",
          basis: "十神生克制化",
        }))
      : [
          {
            k: "无突出的特殊组合",
            t: "十神之间未形成显著的官印相生、伤官见官等典型结构,以日主强弱与用神配合为主论。",
            tone: "mid",
          },
        ],
  });
  // 4 六亲宫位
  const pil = bz.pill.map((p, i) => {
    const sS = i === 2 ? "日主" : shishen(bz.dm, p.s),
      sB = shishen(bz.dm, CANG[p.b][0]);
    const info = BZ_PIL[i];
    const sx = D.ss
      .filter((s) => s.where.includes(["年", "月", "日", "时"][i]))
      .map((s) => s.n)
      .join("、");
    return {
      k: `${info.n} ${GAN[p.s]}${ZHI[p.b]}`,
      t: `主:${info.ext};阶段:${info.age}。\n天干${i === 2 ? "为日主" : `「${sS}」(${BZ_TG[sS].ps}):${BZ_TG[sS].pos}`};地支本气「${sB}」(${BZ_TG[sB].ps}):${BZ_TG[sB].pos};星运${D.cs[i]}。${sx ? `\n神煞:${sx}。` : ""}${D.kong.includes(p.b) && i !== 2 ? `\n此柱地支落日柱空亡,力量偏虚,所主之事易有落空或延迟。` : ""}`,
      tone: "mid",
      basis: "宫位 × 十神",
    };
  });
  sec.push({ title: "四柱六亲宫位", items: pil, collapse: true });
  // 5 婚姻
  const isM = gender === "M",
    spouseStars = isM ? ["正财", "偏财"] : ["正官", "七杀"],
    sp = bzG(tg, spouseStars);
  const dz = bz.pill[2].b,
    dzSS = shishen(bz.dm, CANG[dz][0]);
  const relD = D.rel.filter((r) => r.cols && r.cols.includes(2) && r.tag === "支");
  const marr = [];
  marr.push({
    k: "配偶宫(日支)",
    t: `日支${ZHI[dz]}为「${dzSS}」:${isM ? "男命看财星,日支为" : "女命看官杀,日支为"}配偶宫。${BZ_TG[dzSS].ps}。${dzSS === "比肩" || dzSS === "劫财" ? "配偶宫见同类,配偶个性强、彼此各有主见,需尊重界线。" : dzSS === "食神" || dzSS === "伤官" ? "配偶宫见食伤,伴侣有才华、感情表达较活,女命伤官则需谨慎沟通。" : dzSS === "正财" || dzSS === "正官" ? "配偶宫见正星,姻缘较为端正踏实。" : dzSS === "偏财" || dzSS === "七杀" ? "配偶宫见偏星,关系较强烈或多变,重激情与冲击。" : "配偶宫见印星,伴侣偏照顾型或年长型,重精神与安全感。"}`,
    basis: "日支十神",
  });
  marr.push({
    k: isM ? "妻星(财)" : "夫星(官杀)",
    t: `${isM ? "财" : "官杀"}星力量 ${sp.toFixed(1)}:${sp < 0.6 ? "配偶星偏弱,姻缘晚熟或需主动经营,宜运至财/官旺时" : sp < 2 ? "配偶星适度,姻缘条件较正常" : "配偶星偏重," + (isM ? "易有多段缘分或家庭压力" : "易有多位追求者、婚后压力偏大") + ",需专一与取舍"}。${isM ? (bzG(tg, ["比肩", "劫财"]) >= 2.2 ? "比劫重,注意家庭财务共担与第三者。" : "") : bzG(tg, ["食神", "伤官"]) >= 2.2 ? "食伤重,克制官杀,婚姻中宜柔和表达、避免言语冲撞。" : ""}`,
    basis: "配偶星统计",
  });
  if (relD.length)
    marr.push({
      k: "配偶宫刑冲合害",
      t: relD
        .map(
          (r) =>
            r.txt +
            "——" +
            (r.t === "合"
              ? "合则牵绊,利婚恋(合而不化仍需看喜忌)"
              : r.t === "冲"
                ? "冲则动,婚姻宫易变动、聚少离多或关系起伏,并不必然离散"
                : r.t === "刑"
                  ? "刑则纠缠,细节摩擦多"
                  : r.t === "破"
                    ? "破则局部受损、计划有折"
                    : "害则暗中嫌隙,宜多沟通"),
        )
        .join("\n"),
      tone: relD.some((r) => r.t === "合") && !relD.some((r) => r.t !== "合") ? "good" : "bad",
      basis: "日支与他支关系",
    });
  const lovess = D.ss
    .filter((s) => ["桃花(咸池)", "红鸾", "天喜", "孤辰", "寡宿"].includes(s.n))
    .map((s) => `${s.n}(${s.where.join("")})`);
  if (lovess.length)
    marr.push({
      k: "情感相关神煞",
      t: lovess.join("、") + "。桃花、红鸾、天喜偏主缘分与魅力;孤辰寡宿偏主独处倾向,均属参考。",
      tone: "mid",
      basis: "神煞",
    });
  sec.push({ title: "婚恋", items: marr });
  // 6 事业财运
  const jobs = [];
  const g = groups,
    top = Object.entries(g).sort((a, b) => b[1] - a[1])[0][0];
  const fav = D.xy.favor.map((x) => WXN[x]);
  jobs.push({
    k: "事业倾向",
    t: `月令十神与格局为「${D.gj.name}」;五类力量以「${top}」最重。${{ 官杀: "官杀偏重:适合组织内发展、管理与规范化平台,承压能力是关键。", 食伤: "食伤偏重:适合靠技能、内容、创意或专业服务立足,自由度越高越能发挥。", 财: "财星偏重:适合经营、贸易、资源整合及与人、钱打交道的岗位。", 印: "印星偏重:适合学术、文化、教育、研究及需资历与信用的岗位。", 比劫: "比劫偏重:适合团队合作、合伙创业或竞争型行业,须处理好利益分配。" }[top]}`,
    basis: "十神结构",
  });
  jobs.push({
    k: "行业五行取向",
    t: `用神五行为${fav.join("、")}。对应行业倾向(仅供参考):${fav.map((w) => `${w}——${BZ_IND[w]}`).join(";")}。行业只是环境选择,能力与所在平台更为关键。`,
    basis: "喜用五行 × 行业类象",
  });
  const cai = g.财,
    bi = g.比劫;
  jobs.push({
    k: "财运特征",
    t: `${cai < 0.6 ? "财星偏弱:钱财较需主动争取,宜靠专业与稳定积累,不宜押注" : cai < 2.2 ? "财星适中:财路较为正常,与努力程度直接相关" : "财星偏重:机会与资金流动多,须看日主能否承担"}。${g.食伤 >= 1.2 && cai >= 0.6 ? "食伤生财结构,以技能变现见长。" : ""}${bi >= 2.2 && cai >= 0.6 ? "比劫重,防合伙分利与借贷担保。" : ""}${bzStemHas(bz, "偏财") ? "天干透偏财,偏财运与人脉资源起作用。" : ""}${bzStemHas(bz, "正财") ? "天干透正财,正当收入稳定。" : ""}`,
    basis: "财星、比劫、食伤",
  });
  sec.push({ title: "事业与财运", items: jobs });
  // 7 健康
  const wx = bz.wx.slice(),
    hb = [];
  const sorted = wx.map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v);
  hb.push({
    k: "五行分布",
    t:
      wx.map((v, i) => `${WXN[i]}${v.toFixed(1)}`).join(" · ") +
      `。最旺:${WXN[sorted[0].i]}(${BZ_ORG[WXN[sorted[0].i]]});最弱:${WXN[sorted[4].i]}(${BZ_ORG[WXN[sorted[4].i]]})。`,
    basis: "天干 + 藏干权重",
  });
  hb.push({
    k: "倾向",
    t: `传统上五行过旺或过弱都对应相关脏腑的“负担点”:${WXN[sorted[0].i]}过旺宜防${BZ_ORG[WXN[sorted[0].i]]}的亢盛与压力性问题;${WXN[sorted[4].i]}偏弱宜留意${BZ_ORG[WXN[sorted[4].i]]}的保养。${
      D.rel
        .filter((r) => r.t === "冲")
        .map((r) => r.txt)
        .join(";")
        ? `\n地支/天干冲克:${D.rel
            .filter((r) => r.t === "冲")
            .map((r) => r.txt)
            .join(";")},冲动之处也主相关部位与生活节奏的起伏。`
        : ""
    }`,
    tone: "mid",
    basis: "五行 × 脏腑类象",
  });
  sec.push({
    title: "健康倾向",
    items: hb,
    note: "此为传统五行类象,不是医学诊断;身体不适请就医。",
  });
  // 8 运势
  const dts = dayunTable(bz, D);
  const age = nowYear ? nowYear - lunar.year + 1 : 0;
  const run = [];
  if (age >= 1) {
    let cur = -1;
    dts.forEach((d, i) => {
      if (age >= Math.floor(d.startAge)) cur = i;
    });
    if (cur >= 0) {
      const d = dts[cur];
      run.push({
        k: `当前大运 ${d.gz}(${Math.floor(d.startAge)}岁起)`,
        t: `天干${GAN[d.idx % 10]}为「${d.ss}」,大运倾向「${d.lv}」。${d.notes.length ? "触发:" + d.notes.join("、") + "。" : ""}大运十年为背景,天干主前五年、地支主后五年(通行说法)。与取用${D.xy.favor.map((x) => WXN[x]).join("")}${D.xy.favor.includes(GAN_WX[d.idx % 10]) ? "相合,顺势而为" : "不同气,宜稳中求进"}。`,
        tone: d.lv.includes("吉") ? "good" : d.lv.includes("凶") ? "bad" : "mid",
        basis: "大运干支 × 原局喜忌",
      });
    }
    const ly = liunian(bz, D, nowYear, 5);
    run.push({
      k: `近五年流年`,
      t: ly
        .map(
          (x) => `${x.y}${x.gz}(${x.ss},${x.lv}${x.notes.length ? "·" + x.notes.join("/") : ""})`,
        )
        .join(";"),
      basis: "流年干支 × 原局喜忌",
    });
  } else run.push({ k: "运势", t: "所选时刻晚于今天或尚未出生,请切换到出生时间查看大运流年。" });
  sec.push({
    title: "运势节奏",
    items: run,
    note: "倾向值仅表示干支五行与原局喜忌的契合度以及对日支月支的冲合,不预测具体事件。",
  });
  // 9 神煞
  const ssItems = D.ss.map((s) => {
    const wtxt = s.where
      .map((w) => {
        const i = ["年", "月", "日", "时"].indexOf(w[0]);
        return i >= 0 ? `${w}柱(${BZ_PIL[i].ext.split("、")[0]})` : w;
      })
      .join("、");
    return {
      k: `${s.n} · ${s.where.join("")}`,
      t: `${BZ_SS_DESC[s.n] || s.desc}。见于${wtxt}:${s.tone === "吉" ? "为助力" : s.tone === "凶" ? "需留意化解" : "看整体配合"}。`,
      tone: s.tone === "吉" ? "good" : s.tone === "凶" ? "bad" : "mid",
      basis: "查表神煞(通行口径)",
    };
  });
  sec.push({
    title: "神煞详解",
    items: ssItems.length
      ? ssItems
      : [{ k: "无常见神煞", t: "四柱未见常用神煞。神煞本为辅助,不影响主体结构判断。" }],
    collapse: true,
    note: "神煞是后世附加的象法,不同书籍取法不同,重要性一般低于十神、格局与运势。",
  });
  // 10 合冲刑害
  const rel = D.rel.map((r) => {
    const pos = (r.cols || []).map((i) => BZ_PIL[i].n.replace("柱", "")).join("与");
    const meaning = {
      合: "相合:牵绊、融合、事情有“聚”的一面(合化需条件,合而不化时多为牵绊)",
      冲: "相冲:动荡、变化、分离与转折,有“动”的一面",
      刑: "相刑:纠缠、摩擦、内耗与反复",
      害: "相害:暗中嫌隙、细节上的不顺",
      破: "相破:局部损耗、计划受破",
    }[r.t];
    const pill =
      (r.cols || [])[0] !== undefined && (r.cols || []).length
        ? `发生于${pos}之间:` +
          (() => {
            const s = (r.cols || []).slice().sort().join("");
            return (
              {
                "01": "祖上/早年与父母兄弟的关系或环境变动",
                "02": "早年与自身、配偶之间的隐性影响",
                "03": "早年与晚年、子女的呼应",
                12: "父母兄弟/事业与自身配偶的关系,月支日支牵动事业与婚姻",
                13: "事业宫与子女宫、晚年的关系",
                23: "自身配偶与子女的关系,中晚年家庭",
              }[s] || ""
            );
          })()
        : "";
    return {
      k: r.txt,
      t: `${meaning}。${pill}`,
      tone: r.t === "合" ? "good" : r.t === "冲" || r.t === "刑" ? "bad" : "mid",
      basis: r.k,
    };
  });
  sec.push({
    title: "合冲刑害",
    items: rel.length
      ? rel
      : [{ k: "四柱平和", t: "四柱之间没有明显的合冲刑害,结构较稳,变动主要来自大运流年引入。" }],
    collapse: true,
  });
  // 总评
  sum.push({
    tone: "mid",
    text: `${bz.pill.map((p) => GAN[p.s] + ZHI[p.b]).join(" ")};日主${dm}${wxn},${D.st.season}令,${D.st.level}(${ratioPct}%);${D.gj.name}。`,
  });
  sum.push({
    tone: "good",
    text: `取用:${D.xy.favor.map((x) => WXN[x]).join("、")};宜抑:${D.xy.avoid.map((x) => WXN[x]).join("、") || "—"}。`,
  });
  if (pats.length)
    sum.push({
      tone: pats[0].t === "吉" ? "good" : pats[0].t === "凶" ? "bad" : "mid",
      text: `结构特点:${pats.map((x) => x.n).join("、")}。`,
    });
  return { summary: sum, sections: sec };
}

/* =====================================================================
   奇门遁甲 · 格局识别 + 按事项分析引擎
   方法:先定「我(日干)」「事(时干)」「用神(依事项)」三方所落之宫,再逐宫评:门、星、神、天地盘干格局、
   空亡/门迫/击刑/入墓、宫五行对月令的旺衰;最后看用神宫与我方宫的五行生克、值符值使的指向。
   依据:《烟波钓叟歌》《奇门遁甲统宗》及通行“时家奇门”讲义。格局名以通行歌诀为准。
   ===================================================================== */
const QM_JIXING = { 戊: 3, 己: 2, 庚: 8, 辛: 9, 壬: 4, 癸: 4 };
const QM_MU = { 乙: 2, 丙: 6, 戊: 6, 丁: 8, 己: 8, 庚: 8, 辛: 4, 壬: 4, 癸: 2 };
const QM_PAIR = {
  // 天盘干+地盘干
  戊丙: ["青龙返首", "吉", "天盘戊加地盘丙:财与光明相会,主谋事顺遂"],
  丙戊: ["飞鸟跌穴", "吉", "天盘丙加地盘戊:光明入财库,主事有成果"],
  乙丙: ["奇仪顺遂", "吉", "乙奇加丙奇:日月同辉,合作顺遂"],
  乙丁: ["奇仪相佐", "吉", "乙奇加丁奇:文书、音讯得助"],
  丙乙: ["日月并行", "吉", "丙奇加乙奇:光明相扶,利谋事"],
  丁乙: ["人遁吉格", "吉", "丁奇加乙奇:文明相扶,宜求谒"],
  丁丙: ["星随月转", "吉", "丁奇加丙奇:文书音信随势而动"],
  乙辛: ["青龙逃走", "凶", "乙奇加辛:乙木被金克,主人财易失、事有变"],
  辛乙: ["白虎猖狂", "凶", "辛加乙:金克木,主争斗与损伤"],
  丙庚: ["荧入白", "凶", "丙火加庚金:火炼金,主贼(阻力)将去,但先有折损"],
  庚丙: ["白入荧", "凶", "庚金加丙火:金入火,主贼(阻力)将来,事有反复"],
  丁癸: ["朱雀投江", "凶", "丁加癸:文书、音信沉没,多主口舌与消息受阻"],
  癸丁: ["螣蛇夭矫", "凶", "癸加丁:虚惊、缠绕,事多反复"],
  丙丙: ["月奇悖师", "凶", "丙加丙:光明太过,主文书有误、急躁生变"],
  壬壬: ["蛇入地罗", "凶", "壬加壬:重水成困,主纠缠受困"],
  癸癸: ["天网四张", "凶", "癸加癸:网罗重重,主行事受阻"],
  辛辛: ["伏吟(辛)", "凶", "辛加辛:自罚,主自伤或反复受挫"],
  戊戊: ["伏吟(戊)", "平", "戊加戊:资金停滞、宜守"],
};
function qmHeavenPal(q, stem) {
  for (const p of [1, 2, 3, 4, 6, 7, 8, 9]) {
    const c = q.cells[p];
    if (c.hs === stem || (c.extra && c.extra.stem === stem)) return p;
  }
  return null;
}
function qmDayYi(R) {
  const s = GAN[R.bz.dm];
  return s === "甲" ? ["戊", "己", "庚", "辛", "壬", "癸"][Math.floor(R.bz.dayIdx / 10)] : s;
}
function qmHourYi(R) {
  const s = GAN[R.bz.pill[3].s];
  return s === "甲" ? R.qm.dun : s;
}
/* 为每宫计算“吉凶格”,写入 c.extra2 */
function qimenPlus(q, R) {
  const dayYi = qmDayYi(R);
  [1, 2, 3, 4, 6, 7, 8, 9].forEach((p) => {
    const c = q.cells[p];
    c.extra2 = [];
    const add = (n, t, d) => c.extra2.push({ n, t, d });
    const hs = c.hs,
      ed = c.earth,
      pair = QM_PAIR[hs + ed];
    if (pair && !c.geju.some((g) => g.n === pair[0])) add(pair[0], pair[1], pair[2]);
    if (QM_JIXING[hs] === p) add("六仪击刑", "凶", `天盘${hs}落${PNAME[p]}${PNUM[p]}宫,自刑受克`);
    if (QM_MU[hs] === p)
      add("入墓", "凶", `天盘${hs}入墓于${PNAME[p]}${PNUM[p]}宫:力量被收藏,主事迟滞`);
    // 遁
    if (c.door === "生" && hs === "丙" && ed === "丁")
      add("天遁", "吉", "生门·丙奇·地盘丁:光明生发,利谋大事");
    if (c.door === "开" && hs === "乙" && ed === "己")
      add("地遁", "吉", "开门·乙奇·地盘己:利藏、利营建、利隐谋");
    if (c.door === "休" && hs === "丁" && c.god === "太阴")
      add("人遁", "吉", "休门·丁奇·太阴:利谋划、求见贵人");
    if (c.door === "生" && hs === "丙" && c.god === "九天")
      add("神遁", "吉", "生门·丙奇·九天:利祭祀祈福、宏图大展");
    if (c.door === "杜" && hs === "丁" && c.god === "九地")
      add("鬼遁", "平", "杜门·丁奇·九地:利暗中行事、埋伏、隐匿");
    if ("乙丙丁".includes(hs) && "开休生".includes(c.door)) {
      if (c.god === "太阴") add("真诈", "吉", "三奇+吉门+太阴:暗中得助,利谋略");
      if (c.god === "九地") add("重诈", "吉", "三奇+吉门+九地:利藏形、守成、伏兵");
      if (c.god === "六合") add("休诈", "吉", "三奇+吉门+六合:利联姻、交易、合作");
    }
    if ("乙丙丁".includes(hs) && p === q.rr)
      add("三奇得使", "吉", "三奇与值使门同宫:事有名目、行有所据");
    if (p === q.rr && hs === "丁") add("玉女守门", "吉", "值使门加丁奇:利婚恋、文书、宴饮");
    // 六庚格
    if (hs === "庚") {
      if (ed === dayYi && dayYi !== "庚")
        add("伏干格", "凶", "天盘庚加日干:自身受阻、我方行事被压");
      if (ed === q.dun && q.dun !== "庚")
        add("天乙伏宫", "凶", "天盘庚加值符:领导/主事者受制,大事宜缓");
      if (ed === "癸") add("大格", "凶", "庚加癸:阻隔极重,忌远行与大事");
      if (ed === "壬") add("小格", "凶", "庚加壬:小阻、移动不定,宜静");
      if (ed === "己") add("刑格", "凶", "庚加己:刑伤,官非口舌、忌诉讼");
      if (ed === "庚") add("太白同宫", "凶", "庚加庚:战格,主争斗冲突");
    }
    if (ed === "庚" && hs !== "庚") {
      if (hs === dayYi) add("飞干格", "凶", "日干加临庚:自身遇阻,反受其制");
      if (hs === q.dun) add("天乙飞宫", "凶", "值符加庚:主事者受阻,宜避");
    }
    if (hs === "壬" && ed === "壬") add("天网四张", "凶", "壬加壬:网罗四张,行事受困");
  });
  // 五不遇时
  const dayS = R.bz.dm,
    hourS = R.bz.pill[3].s;
  q.wubuyu = (hourS - dayS + 10) % 10 === 6 && hourS % 2 === dayS % 2; // 时干克日干且阴阳同(七杀)
  q.wubuyuNote = q.wubuyu
    ? "本时为“五不遇时”(时干克日干):传统谓“龙不回头”,吉格难以兑现,不宜重大启动。"
    : "";
  return q;
}
/* ---------- 宫位评分 ---------- */
const QM_GOD_SC = {
  值符: 1,
  九天: 0.6,
  九地: 0.6,
  太阴: 1,
  六合: 1,
  腾蛇: -1,
  白虎: -1,
  勾陈: -0.8,
  玄武: -1,
  朱雀: -0.5,
};
const QM_GOD_TXT = {
  值符: "贵人首领,主有靠山",
  腾蛇: "虚惊缠绕,易多疑",
  太阴: "暗中相助,宜谋不宜争",
  六合: "和合中介,利合作",
  白虎: "强势凶险,防冲突伤损",
  勾陈: "牵连迟滞,事拖延",
  玄武: "暗昧欺瞒,防盗失与不实",
  朱雀: "文书口舌,消息多",
  九地: "隐藏守静,利守不利攻",
  九天: "高远进取,利扩张",
};
const QM_DOOR_TXT = {
  休: "休门:安顿、休整、贵人相见,利求谒与平稳推进",
  生: "生门:生发、求财、置业,利谋利成长",
  伤: "伤门:竞争、伤害、讨债,不利求安,利催讨",
  杜: "杜门:闭塞、隐藏、技术,利防守隐匿而不利通达",
  景: "景门:文书、信息、考试、名声,火性易急",
  死: "死门:终结、停滞、土地,不利进取,利收尾与吊丧",
  惊: "惊门:惊恐、口舌、官非、意外,利诉讼与音讯",
  开: "开门:开创、通达、公事,利事业与上班",
};
const QM_STAR_TXT = {
  蓬: "天蓬:险与智,盗与水,险中求",
  芮: "天芮:病灶与教育,主病主慢",
  冲: "天冲:冲动行动,利快攻",
  辅: "天辅:文教贵人,利学业",
  禽: "天禽:中和居中,主领袖",
  心: "天心:医药谋略,利治病与决策",
  柱: "天柱:破坏毁折,主口舌毁败",
  任: "天任:稳重信托,利置产守成",
  英: "天英:火性急躁,利文书与美",
};
function qmSeason(R, p) {
  const mb = R.bz.pill[1].b,
    sw = { 寅: 0, 卯: 0, 巳: 1, 午: 1, 辰: 2, 戌: 2, 丑: 2, 未: 2, 申: 3, 酉: 3, 亥: 4, 子: 4 }[
      ZHI[mb]
    ],
    pw = PWX[p];
  const d = (pw - sw + 5) % 5; // 0同 1宫生月令(休) 2宫克月令(囚) 3月令克宫(死) 4月令生宫(相)
  return [
    ["旺", 1],
    ["休", 0],
    ["囚", -0.5],
    ["死", -1],
    ["相", 0.5],
  ][d];
}
function qmCell(q, R, p) {
  const c = q.cells[p],
    lines = [];
  let sc = 0;
  const d = DOOR_SC[c.door] || 0;
  sc += d;
  lines.push({ t: `${c.door}门 ${d > 0 ? "+" : ""}${d}`, k: "门" });
  const s = STAR_SC[c.star] || 0;
  sc += s;
  lines.push({ t: `天${c.star} ${s > 0 ? "+" : ""}${s}`, k: "星" });
  const g = QM_GOD_SC[c.god] || 0;
  sc += g;
  lines.push({ t: `${c.god} ${g > 0 ? "+" : ""}${g}`, k: "神" });
  c.geju.concat(c.extra2 || []).forEach((x) => {
    const v = x.t === "吉" ? 1.5 : x.t === "凶" ? -1.5 : 0;
    sc += v;
    if (v) lines.push({ t: `${x.n} ${v > 0 ? "+" : ""}${v}`, k: "格" });
    else lines.push({ t: x.n, k: "格" });
  });
  c.tags.forEach((x) => {
    if (x.n === "门迫") {
      sc -= 1;
      lines.push({ t: "门迫 −1", k: "忌" });
    }
    if (x.n === "空亡") {
      sc -= 1.5;
      lines.push({ t: "空亡 −1.5", k: "忌" });
    }
  });
  const se = qmSeason(R, p);
  sc += se[1];
  lines.push({ t: `宫${WXN[PWX[p]]}·月令${se[0]} ${se[1] > 0 ? "+" : ""}${se[1]}`, k: "时" });
  return { p, sc, lines, cell: c, season: se[0] };
}
/* 我/事/用神 */
function qmDoorPal(q, d) {
  return [1, 2, 3, 4, 6, 7, 8, 9].find((p) => q.cells[p].door === d) || null;
}
function qmStarPal(q, s) {
  return [1, 2, 3, 4, 6, 7, 8, 9].find((p) => q.cells[p].star === s) || null;
}
function qmGodPal(q, g) {
  return [1, 2, 3, 4, 6, 7, 8, 9].find((p) => q.cells[p].god === g) || null;
}
const QM_TOPICS = {
  求财: {
    icon: "财",
    desc: "以生门为财源,戊为资本;六合看合作与中介",
    ys: (q, R) => [
      ["生门(财源)", qmDoorPal(q, "生"), 1],
      ["戊(资本)", qmHeavenPal(q, "戊"), 0.6],
      ["六合(合作中介)", qmGodPal(q, "六合"), 0.3],
    ],
    rel: "财",
  },
  事业: {
    icon: "业",
    desc: "以开门为公事事业,值符为领导贵人,值使为事情推进",
    ys: (q, R) => [
      ["开门(事业)", qmDoorPal(q, "开"), 1],
      ["值符(领导/贵人)", q.q, 0.7],
      ["值使门(事之进展)", q.rr, 0.4],
    ],
    rel: "官",
  },
  感情: {
    icon: "缘",
    desc: "男问以乙(女)为对象,女问以庚(男)为对象,六合为媒",
    ys: (q, R) => [
      [
        R.opt.gender === "M" ? "乙(女方/所求之人)" : "庚(男方/所求之人)",
        qmHeavenPal(q, R.opt.gender === "M" ? "乙" : "庚"),
        1,
      ],
      ["六合(缘分/媒介)", qmGodPal(q, "六合"), 0.8],
      ["景门(彼此心意)", qmDoorPal(q, "景"), 0.2],
    ],
    rel: "人",
  },
  健康: {
    icon: "医",
    desc: "天芮为病位、天心为医药;死门主危重,生门主康复",
    ys: (q, R) => [
      ["天芮(病位)", qmStarPal(q, "芮"), 1],
      ["天心(医药)", qmStarPal(q, "心"), 0.7],
      ["生门(康复)", qmDoorPal(q, "生"), 0.5],
      ["死门(危重)", qmDoorPal(q, "死"), 0.3],
    ],
    rel: "病",
    risk: true,
  },
  出行: {
    icon: "行",
    desc: "看开休生三吉门与驿马;日干宫为自身",
    ys: (q, R) => [
      ["开门", qmDoorPal(q, "开"), 0.8],
      ["休门", qmDoorPal(q, "休"), 0.6],
      ["生门", qmDoorPal(q, "生"), 0.6],
      ["驿马宫", q.horseP, 0.4],
    ],
    rel: "行",
  },
  学业: {
    icon: "学",
    desc: "景门为文书考试,天辅为文教,丁奇为文明",
    ys: (q, R) => [
      ["景门(考试文书)", qmDoorPal(q, "景"), 1],
      ["天辅(文教)", qmStarPal(q, "辅"), 0.7],
      ["丁奇(文明)", qmHeavenPal(q, "丁"), 0.5],
      ["值符(考官/师长)", q.q, 0.4],
    ],
    rel: "文",
  },
  官司: {
    icon: "讼",
    desc: "我(日干)对彼(时干);惊门为官非口舌,开门为官府,值符为裁断者",
    ys: (q, R) => [
      ["惊门(官非口舌)", qmDoorPal(q, "惊"), 0.6],
      ["开门(官府)", qmDoorPal(q, "开"), 0.6],
      ["值符(裁断者)", q.q, 0.6],
    ],
    rel: "讼",
    duel: true,
  },
  合作: {
    icon: "合",
    desc: "六合为合作,我与彼(时干)看关系;景门看合同,开门看通达",
    ys: (q, R) => [
      ["六合(合作)", qmGodPal(q, "六合"), 1],
      ["景门(合同)", qmDoorPal(q, "景"), 0.4],
      ["开门(通达)", qmDoorPal(q, "开"), 0.4],
    ],
    rel: "合",
    duel: true,
  },
  置业: {
    icon: "宅",
    desc: "生门为生发、死门主土地房产、天任主田宅稳重",
    ys: (q, R) => [
      ["生门(增值)", qmDoorPal(q, "生"), 1],
      ["死门(土地房产)", qmDoorPal(q, "死"), 0.5],
      ["天任(田宅稳重)", qmStarPal(q, "任"), 0.5],
    ],
    rel: "宅",
  },
};
const QM_REL_TXT = {
  // 用神宫 vs 我方宫 的五行关系
  same: "用神与日干同宫:事就在你身上,主动权在己,成败更多取决于自身状态。",
  shengwo: "用神宫生日干宫:事来生我,得助得利,顺势而为。",
  wosheng: "日干宫生用神宫:我生事,需要付出、投入、耗费精力资金,回报在后。",
  woke: "日干宫克用神宫:我克事,我能掌控、可得,但要主动出手、有一定阻力。",
  keWo: "用神宫克日干宫:事克我,我受制、被动或承压,需借势化解(印/比助身)。",
  bihe: "用神宫与日干宫五行相同:平等、同类,合作或同行竞争。",
};
function qmRel(R, ps, pt) {
  if (ps === pt) return "same";
  const a = PWX[ps],
    b = PWX[pt];
  if (a === b) return "bihe";
  if ((b - a + 5) % 5 === 1) return "wosheng";
  if ((b - a + 5) % 5 === 2) return "woke";
  if ((a - b + 5) % 5 === 1) return "shengwo";
  return "keWo";
}
const qmVerdict = (v) =>
  v >= 3
    ? ["盘面顺", "good"]
    : v >= 1.5
      ? ["偏顺", "good"]
      : v > -1.5
        ? ["中平", "mid"]
        : v > -3
          ? ["偏阻", "bad"]
          : ["阻滞明显", "bad"];
function qimenAsk(R, topic) {
  const q = R.qm,
    T = QM_TOPICS[topic];
  const dayYi = qmDayYi(R),
    hourYi = qmHourYi(R);
  const pSelf = qmHeavenPal(q, dayYi),
    pEvent = qmHeavenPal(q, hourYi);
  const all = [1, 2, 3, 4, 6, 7, 8, 9].map((p) => qmCell(q, R, p));
  const byP = {};
  all.forEach((x) => (byP[x.p] = x));
  const sec = [],
    sum = [];
  // 基础
  const base = [];
  base.push({
    k: "盘面基础",
    t: `${q.yang ? "阳" : "阴"}遁${PNUM[q.ju]}局(${q.term}${q.yuanName}),时柱${q.hourGZ},值符天${q.zfStar}落${PNAME[q.q]}${PNUM[q.q]}宫、值使${q.zsDoor}门落${PNAME[q.rr]}${PNUM[q.rr]}宫。${q.fuyin ? "伏吟:盘面不动,主事拖延、宜静守。" : ""}${q.fanyin ? "反吟:盘面对冲,主事反复、来去不定。" : ""}${q.wubuyuNote}`,
    tone: q.wubuyu || q.fanyin ? "bad" : "mid",
    basis: "定局",
  });
  base.push({
    k: "我与事",
    t: `日干${GAN[R.bz.dm]}${GAN[R.bz.dm] === "甲" ? "(甲遁于" + dayYi + ")" : ""}落${pSelf ? PNAME[pSelf] + PNUM[pSelf] + "宫(" + PDIR[pSelf] + ")" : "(未见)"},代表问事者本人;时干${GAN[R.bz.pill[3].s]}${GAN[R.bz.pill[3].s] === "甲" ? "(甲遁于" + hourYi + ")" : ""}落${pEvent ? PNAME[pEvent] + PNUM[pEvent] + "宫(" + PDIR[pEvent] + ")" : "(未见)"},代表所占之事本身或对方。`,
    basis: "天盘日干/时干",
  });
  if (pSelf) {
    const x = byP[pSelf];
    base.push({
      k: "我方状态",
      t: `${x.cell.door}门、天${x.cell.star}、${x.cell.god}。${QM_DOOR_TXT[x.cell.door]}。${QM_GOD_TXT[x.cell.god]}。宫内格局:${
        x.cell.geju
          .concat(x.cell.extra2 || [])
          .map((g) => g.n)
          .join("、") || "无特殊格"
      };${x.cell.tags.map((t) => t.n).join("、") || "无空亡门迫"}。宫${WXN[PWX[pSelf]]}逢月令${x.season}。综合得分 ${x.sc.toFixed(1)}。`,
      tone: qmVerdict(x.sc)[1],
      basis: "我方宫评分",
    });
  }
  sec.push({ title: "盘面与我事", items: base });
  // 用神
  const ys = T.ys(q, R).filter((y) => y[1]);
  const yItems = [];
  let wsum = 0,
    tot = 0;
  const details = [];
  ys.forEach(([label, p, w]) => {
    const x = byP[p] || qmCell(q, R, p);
    // 病位类反向
    let s = x.sc;
    if (T.risk && (label.startsWith("天芮") || label.startsWith("死门"))) s = -x.sc;
    wsum += w;
    tot += s * w;
    const ge = x.cell.geju.concat(x.cell.extra2 || []);
    const rel = pSelf ? qmRel(R, pSelf, p) : null;
    const relTxt = rel ? QM_REL_TXT[rel] : "";
    const parts = [
      `${label}落${PNAME[p]}${PNUM[p]}宫(${PDIR[p]}):${QM_DOOR_TXT[x.cell.door]}。${QM_STAR_TXT[x.cell.star]}。${x.cell.god}:${QM_GOD_TXT[x.cell.god]}。`,
      `天盘${x.cell.hs}加地盘${x.cell.earth}${ge.length ? "——" + ge.map((g) => g.n + "(" + g.t + ")").join("、") : ""}。${ge
        .map((g) => g.d)
        .filter(Boolean)
        .join(";")}`,
      x.cell.tags.length
        ? `标记:${x.cell.tags.map((t) => t.n).join("、")}。${x.cell.tags.some((t) => t.n === "空亡") ? "此宫落空亡:所主之事虚而未实,须待填实或出空后方见结果。" : ""}${x.cell.tags.some((t) => t.n === "门迫") ? "门迫:门被宫克,吉门减力、凶门更凶。" : ""}`
        : "",
      `宫${WXN[PWX[p]]}逢月令${x.season}。`,
      relTxt ? `与我方宫:${relTxt}` : "",
    ]
      .filter(Boolean)
      .join("\n");
    yItems.push({
      k:
        label +
        (T.risk && (label.startsWith("天芮") || label.startsWith("死门")) ? "(以“低为好”论)" : ""),
      t: parts,
      tone: qmVerdict(s)[1],
      badge: `得分 ${x.sc.toFixed(1)}`,
      basis: "逐宫评分:" + x.lines.map((l) => l.t).join(" · "),
    });
    details.push({ label, p, s, x, rel });
  });
  if (!ys.length)
    yItems.push({
      k: "用神未现",
      t: "所需用神在本盘中未落于八宫(可能落中宫寄坤),此时以我方宫与时干宫的状况为主论。",
    });
  sec.push({ title: `用神分析:${topic}`, items: yItems, note: T.desc });
  // 我与事关系(duel)
  if (T.duel && pSelf && pEvent) {
    const a = byP[pSelf],
      b = byP[pEvent];
    const diff = a.sc - b.sc;
    const rel = qmRel(R, pSelf, pEvent);
    sec.push({
      title: "我与彼的力量对比",
      items: [
        {
          k: "对比",
          t: `我方宫得分 ${a.sc.toFixed(1)},对方(时干)宫得分 ${b.sc.toFixed(1)},差 ${diff > 0 ? "+" : ""}${diff.toFixed(1)}。${diff >= 2 ? "我方明显占优" : diff <= -2 ? "对方明显占优" : "双方大体相当"}。五行上:${QM_REL_TXT[rel]}${topic === "官司" ? "\n官司中还要看惊门(口舌)、开门(官府)是否落在利我一方,以及值符落宫的倾向。" : "\n合作里更看双方所在宫是否相生相合。"}`,
          tone: diff >= 2 ? "good" : diff <= -2 ? "bad" : "mid",
          basis: "两宫得分与五行",
        },
      ],
    });
  }
  // 值符值使
  const zf = byP[q.q],
    zs = byP[q.rr];
  const zItems = [
    {
      k: "值符所在",
      t: `值符落${PNAME[q.q]}${PNUM[q.q]}宫(${PDIR[q.q]}),为“事之主宰、贵人首领”。得分 ${zf.sc.toFixed(1)}:${qmVerdict(zf.sc)[0]}。${details.some((d) => d.p === q.q) ? "值符与用神同宫,主事有主、贵人直接介入。" : ""}`,
      tone: qmVerdict(zf.sc)[1],
      basis: "值符宫",
    },
    {
      k: "值使所在",
      t: `值使${q.zsDoor}门落${PNAME[q.rr]}${PNUM[q.rr]}宫(${PDIR[q.rr]}),为“事情推进的通道”。${QM_DOOR_TXT[q.zsDoor]}。得分 ${zs.sc.toFixed(1)}:${qmVerdict(zs.sc)[0]}。`,
      tone: qmVerdict(zs.sc)[1],
      basis: "值使宫",
    },
  ];
  sec.push({ title: "值符 · 值使", items: zItems });
  // 综合
  const avg = wsum ? tot / wsum : 0;
  let adj = avg + (q.fuyin ? -0.4 : 0) + (q.fanyin ? -0.4 : 0) + (q.wubuyu ? -1 : 0);
  if (pSelf) adj += (byP[pSelf].sc - 1) * 0.15;
  const v = qmVerdict(adj);
  // 建议
  const goodDirs = all
    .filter((x) => "休生开".includes(x.cell.door) && x.sc >= 2)
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 2);
  const badDirs = all
    .filter((x) => x.sc <= -2)
    .sort((a, b) => a.sc - b.sc)
    .slice(0, 2);
  const adv = [];
  adv.push({
    k: "较顺之方",
    t: goodDirs.length
      ? goodDirs
          .map(
            (x) =>
              `${PDIR[x.p]}(${PNAME[x.p]}${PNUM[x.p]}宫·${x.cell.door}门·${x.cell.god}·${x.sc.toFixed(1)})`,
          )
          .join("、") + "。若涉及出行、会面、选址,可优先考虑这些方向;传统上以“吉门+吉神+吉格”为佳。"
      : "盘中没有兼具吉门与较高得分的方位,宜靠人事努力,不强求方位。",
    tone: "good",
    basis: "吉门且得分≥2",
  });
  adv.push({
    k: "宜避之方",
    t: badDirs.length
      ? badDirs
          .map(
            (x) =>
              `${PDIR[x.p]}(${PNAME[x.p]}${PNUM[x.p]}宫·${x.cell.door}门·${x.cell.god}·${x.sc.toFixed(1)})`,
          )
          .join("、") + "。"
      : "盘中没有明显凶险的方位。",
    tone: "bad",
    basis: "得分≤−2",
  });
  const kongTxt = q.kongB.map((b) => ZHI[b]).join("、");
  adv.push({
    k: "时机与节奏",
    t: `时空亡为${kongTxt}(落${q.kongP.map((p) => PNAME[p] + PNUM[p]).join("、")}宫);${details.some((d) => q.kongP.includes(d.p)) ? "用神宫见空亡,事宜“待时”,可选空亡地支所对应的日/时(填实)或过一旬后再启动。" : "用神宫未落空亡,时机上无此阻碍。"}${q.fuyin ? "伏吟主静,不宜催逼;" : ""}${q.fanyin ? "反吟主反复,宜设备选方案;" : ""}${q.wubuyu ? "“五不遇时”宜改时。" : ""}驿马在${ZHI[q.horseB]}(${PNAME[q.horseP]}${PNUM[q.horseP]}宫),${byP[q.horseP] ? `该宫${byP[q.horseP].cell.door}门,利动不利静${"休生开".includes(byP[q.horseP].cell.door) ? "(门吉,动则有得)" : "(门不吉,动前需评估)"}` : ""}。`,
    basis: "空亡/伏反吟/驿马",
  });
  const cautions = [];
  details.forEach((d) => {
    d.x.cell.extra2
      .concat(d.x.cell.geju)
      .filter((g) => g.t === "凶")
      .forEach((g) => cautions.push(`${d.label}见「${g.n}」:${g.d || ""}`));
  });
  if (cautions.length)
    adv.push({ k: "需特别留意", t: cautions.join("\n"), tone: "bad", basis: "用神宫凶格" });
  sec.push({ title: "建议与提示", items: adv });
  sum.push({
    tone: v[1],
    text: `问「${topic}」:${v[0]}(用神加权 ${adj.toFixed(1)})。${details.length ? details.map((d) => `${d.label}—${PNAME[d.p]}${PNUM[d.p]}宫${d.x.cell.door}门${d.s >= 2 ? "佳" : d.s <= -2 ? "弱" : "平"}`).join(";") : "用神未现"}。`,
  });
  if (pSelf && pEvent && pSelf !== pEvent)
    sum.push({
      tone: "mid",
      text: `我方${PNAME[pSelf]}${PNUM[pSelf]}宫(${byP[pSelf].sc.toFixed(1)})对事方${PNAME[pEvent]}${PNUM[pEvent]}宫(${byP[pEvent].sc.toFixed(1)}),五行关系:${QM_REL_TXT[qmRel(R, pSelf, pEvent)].split(":")[1] || ""}`,
    });
  if (q.wubuyu || q.fuyin || q.fanyin)
    sum.push({
      tone: "bad",
      text:
        [q.wubuyu ? "五不遇时" : "", q.fuyin ? "伏吟" : "", q.fanyin ? "反吟" : ""]
          .filter(Boolean)
          .join("、") + ":时局本身带来阻滞或反复的底色。",
    });
  return { summary: sum, sections: sec, verdict: v, score: adj, topic };
}

/* =====================================================================
   解读引擎(下):大六壬 · 六爻 · 梅花易数 · 玄空飞星
   统一输出 {summary:[{tone,text}], sections:[{title,items:[{k,t,tone,badge,basis}],note,collapse}]}
   声明:均为“规则化的倾向性描述”,依据为各体系通行章法;不同流派的取用与断法可以有很大差异。
   ===================================================================== */
const RM_LV = (v) =>
  v >= 3
    ? ["较顺", "good"]
    : v >= 1.2
      ? ["偏顺", "good"]
      : v > -1.2
        ? ["中平", "mid"]
        : v > -3
          ? ["偏阻", "bad"]
          : ["阻滞明显", "bad"];
const RM_WXR = (a, b) => {
  // 五行 a 相对 b:返回 'same'|'sheng'(a生b)|'ke'(a克b)|'beisheng'(b生a)|'beike'(b克a)
  if (a === b) return "same";
  const d = (b - a + 5) % 5;
  return d === 1 ? "sheng" : d === 2 ? "ke" : d === 4 ? "beisheng" : "beike";
};
const RM_SEASON = (wx, mb) => {
  // 五行在月令中的状态
  const mw = ZHI_WX[mb],
    d = (wx - mw + 5) % 5;
  return [
    ["旺", 1.2],
    ["休", 0],
    ["囚", -0.6],
    ["死", -1.2],
    ["相", 0.7],
  ][d];
};
/* ---------------- 大六壬 ---------------- */
const LR_GE_TXT = {
  元首: [
    "上克下,顺而正",
    "事情按“上克下”的顺序发生,主动、尊长、外来者对下位有利;凡事宜先发制人、循理而行,结果多顺。",
  ],
  重审: [
    "下贼上,逆而审",
    "下位克上位:内部、下级或阴性一方对上位形成压力,事多起于内而带反复;宜再三审察、勿轻信,先难后易。",
  ],
  知一: [
    "比用,两端择一",
    "有两个以上的克关系,取与日干阴阳相同者:事有两途、人有两心,择近而亲者可成。",
  ],
  涉害: [
    "克多取深,历难而成",
    "多个克关系难分先后,取涉害最深者:一路多阻、曲折反复,但坚持到底反有成果。",
  ],
  遥克: [
    "不克而遥克",
    "四课无克,取遥相克日干或被日干克者:事情关系疏远,起因在外、力量较轻,多为间接、远处之事。",
  ],
  昴星: [
    "四课全备无克,虎视/冬蛇",
    "无克无遥克而四课不缺:事情迟滞、隐晦不明。阳日虎视(急迫、有压力)、阴日冬蛇掩目(暗昧、宜守)。",
  ],
  别责: [
    "三课备,借干合",
    "四课不备而只有三课:事情借他人力量或依赖外部条件,自身不完备,宜找人相助。",
  ],
  八专: [
    "两课重叠,专一",
    "日干支同位,四课只有两课:事情专一集中,心思偏向一处,多与同类人事或私下之事有关;宜专攻一点。",
  ],
  伏吟: ["天地盘不动,静守", "盘面静止,事情呻吟、拖延、原地不动;宜静守待时,不宜强动,动则拘束。"],
  返吟: [
    "天地盘对冲,反复",
    "天地盘全冲:去而复来、反复无常,多反悔、往返、分离与重来;有克则先反后定,宜多备后手。",
  ],
};
const LR_JIANG_G = {
  贵人: "吉",
  螣蛇: "凶",
  朱雀: "凶",
  六合: "吉",
  勾陈: "凶",
  青龙: "吉",
  天空: "凶",
  白虎: "凶",
  太常: "吉",
  玄武: "凶",
  太阴: "吉",
  天后: "吉",
};
const LR_TOPIC = {
  求财: {
    icon: "财",
    desc: "以妻财为用神(日干所克),青龙为财神;看其旺衰、天将、是否入传、是否空亡",
    rel: "妻财",
    jiang: ["青龙", "太常"],
  },
  事业: {
    icon: "业",
    desc: "以官鬼为用神(克日干者),贵人为长官;官鬼旺相入传为吉",
    rel: "官鬼",
    jiang: ["贵人", "青龙"],
  },
  婚姻: {
    icon: "缘",
    desc: "男以妻财、女以官鬼为用神,六合、太阴主媒与情",
    rel: "*",
    jiang: ["六合", "太阴"],
  },
  疾病: {
    icon: "医",
    desc: "官鬼为病,子孙为医药(制鬼);天空/白虎/螣蛇为凶象",
    rel: "官鬼",
    jiang: ["白虎", "螣蛇"],
    risk: true,
    med: "子孙",
  },
  官司: {
    icon: "讼",
    desc: "官鬼为官府,朱雀主口舌文书,白虎主刑伤;看日干与日支哪方得势",
    rel: "官鬼",
    jiang: ["朱雀", "白虎"],
    risk: true,
  },
  学业: {
    icon: "学",
    desc: "父母为文书,朱雀为文章,青龙/贵人主考运",
    rel: "父母",
    jiang: ["朱雀", "贵人", "青龙"],
  },
  出行: {
    icon: "行",
    desc: "驿马为动,日干为己;初传主出发、末传主到达",
    rel: "*",
    jiang: ["青龙", "太常"],
  },
  综合: { icon: "总", desc: "不指定事项,看课体、三传流转与我方之势", rel: "*", jiang: [] },
};
function lrRelOf(lr, z) {
  return lr.relOf(z);
}
function liurenReading(R, topic) {
  const lr = R.lr,
    T = LR_TOPIC[topic],
    mb = R.bz.pill[1].b,
    sec = [],
    sum = [];
  const dgWx = GAN_WX[lr.dg];
  const zn = (z) => ZHI[z];
  // 课体
  const ge = LR_GE_TXT[lr.ge] || ["", ""];
  const gs = [
    {
      k: `${lr.ge}课 · ${ge[0]}`,
      t: `${ge[1]}\n取传依据:${lr.sub}。`,
      tone: ["元首", "重审", "知一", "涉害"].includes(lr.ge)
        ? "mid"
        : lr.ge === "伏吟" || lr.ge === "返吟"
          ? "bad"
          : "mid",
      basis: "九宗门",
    },
  ];
  const ke = lr.ke
    .map(
      (k, i) =>
        `${["一课", "二课", "三课", "四课"][i]}:${k.lIsGan ? GAN[lr.dg] + "寄" : ZHI[k.l]}上见${ZHI[k.u]}(${k.rel === "贼" ? "下贼上" : k.rel === "克" ? "上克下" : "无克"},${k.gen})`,
    )
    .join(";");
  gs.push({
    k: "四课",
    t: `${ke}。\n日干上神${zn(lr.ke[0].u)}(${lr.ke[0].gen})代表“我”所处的境况;日支上神${zn(lr.ke[2].u)}(${lr.ke[2].gen})代表“事/宅/对方”所处的境况。`,
    basis: "四课",
  });
  sec.push({ title: "课体与四课", items: gs });
  // 三传
  const names = ["初传(发端·起因)", "中传(过程·转折)", "末传(结果·归宿)"];
  const stage = lr.chu.map((c, i) => {
    const wx = ZHI_WX[c.z],
      se = RM_SEASON(wx, mb);
    const g = LR_JIANG_G[c.gen];
    const rw = RM_WXR(wx, dgWx);
    const relTxt =
      rw === "sheng"
        ? "该传生日干,助我"
        : rw === "beike"
          ? "该传克日干,压我"
          : rw === "ke"
            ? "日干克该传,我可制"
            : rw === "beisheng"
              ? "日干生该传,我耗"
              : "该传与日干同类";
    return {
      k: `${names[i]} · ${zn(c.z)}(${WXN[wx]}) · ${c.gen}`,
      t: `六亲:${c.rel};天将「${c.gen}」主${TJ_BRIEF[c.gen]}(${g});遁干${c.dun || "—"};月令下${se[0]}。${relTxt}。${c.kong ? "\n落空亡:此传虚而不实," + (i === 0 ? "起因不实、开局落空" : i === 1 ? "过程中易生变、有名无实" : "结果易落空,须待出空或填实") + "。" : ""}`,
      tone: c.kong
        ? "bad"
        : g === "吉" && se[1] >= 0
          ? "good"
          : g === "凶" && se[1] < 0
            ? "bad"
            : "mid",
      basis: "三传 × 天将 × 月令",
    };
  });
  sec.push({ title: "三传(事情的起承转合)", items: stage });
  // 三传关系
  const w = lr.chu.map((c) => ZHI_WX[c.z]);
  const flow = (a, b) => RM_WXR(a, b);
  const f12 = flow(w[0], w[1]),
    f23 = flow(w[1], w[2]),
    f31 = flow(w[2], w[0]);
  const rel2 = [];
  if (f12 === "sheng" && f23 === "sheng")
    rel2.push("三传递生(初生中、中生末):事情顺势渐进,愈到后段愈有力,有始有终。");
  else if (f12 === "ke" && f23 === "ke")
    rel2.push("三传递克(初克中、中克末):层层克制,过程不顺、阻力叠加,须借外力化解。");
  else {
    rel2.push(
      `初→中:${{ sheng: "相生,起因促成过程", ke: "相克,起因与过程相抵", same: "同气,一脉相承", beisheng: "中传生初传,过程反哺起因(回头生)", beike: "中传克初传,过程否定起因" }[f12]};中→末:${{ sheng: "相生,过程促成结果", ke: "相克,过程与结果相抵", same: "同气,平稳延续", beisheng: "末传生中传(回生),结果反哺过程", beike: "末传克中传,结果否定过程" }[f23]}。`,
    );
  }
  if (f31 === "ke") rel2.push("末传克初传(回克):结局与起因相冲,常见“事后反悔、结果推翻开端”。");
  else if (f31 === "sheng") rel2.push("末传生初传(归本):结果回护起因,事有终始、能归于原点而稳。");
  const tri = [
    [8, 0, 4],
    [2, 6, 10],
    [5, 9, 1],
    [11, 3, 7],
  ].find((g) => lr.chu.every((c) => g.includes(c.z)));
  const hui = [
    [2, 3, 4],
    [5, 6, 7],
    [8, 9, 10],
    [11, 0, 1],
  ].find((g) => lr.chu.every((c) => g.includes(c.z)));
  if (tri)
    rel2.push(`三传成三合局(${tri.map(zn).join("")}):力量集中、事有合力,主事成而快(需不落空亡)。`);
  if (hui) rel2.push(`三传成三会方(${hui.map(zn).join("")}):同方之气会聚,力量强盛,事势较大。`);
  if (lr.chu.filter((c) => c.kong).length >= 2)
    rel2.push("三传多空:事多虚、难落实,宜等出空之时再启动。");
  sec.push({
    title: "三传流转",
    items: [
      {
        k: "生克走势",
        t: rel2.join("\n"),
        tone:
          f12 === "sheng" && f23 === "sheng"
            ? "good"
            : f12 === "ke" && f23 === "ke"
              ? "bad"
              : "mid",
        basis: "三传五行",
      },
    ],
  });
  // 用神
  let score = 0;
  const yi = [];
  const chuZ = lr.chu.map((c) => c.z);
  const evalLine = (label, z, where, weight) => {
    const wx = ZHI_WX[z],
      se = RM_SEASON(wx, mb),
      g = lr.gen[z],
      gt = LR_JIANG_G[g],
      kong = lr.kong.includes(z);
    let s = se[1] * 0.6 + (gt === "吉" ? 0.8 : -0.8) + (kong ? -1.2 : 0);
    const rw = RM_WXR(wx, dgWx);
    return { label, z, where, wx, se, g, gt, kong, s: s * weight };
  };
  let yongRel = T.rel;
  if (yongRel === "*") yongRel = topic === "婚姻" ? (R.opt.gender === "M" ? "妻财" : "官鬼") : null;
  const cand = [];
  if (yongRel) {
    lr.chu.forEach((c, i) => {
      if (lrRelOf(lr, c.z) === yongRel)
        cand.push(evalLine(yongRel, c.z, ["初传", "中传", "末传"][i], [1, 0.9, 1.3][i]));
    });
    lr.ke.forEach((k, i) => {
      if (lrRelOf(lr, k.u) === yongRel && !chuZ.includes(k.u))
        cand.push(evalLine(yongRel, k.u, ["一课上神", "二课上神", "三课上神", "四课上神"][i], 0.5));
    });
    if (cand.length) {
      cand.forEach((x) => {
        score += x.s + (x.where === "末传" ? 0.5 : x.where === "初传" ? 0.3 : 0);
      });
      yi.push({
        k: `用神 · ${yongRel}`,
        t: cand
          .map(
            (x) =>
              `${zn(x.z)}(${WXN[x.wx]})见于${x.where},天将${x.g}(${x.gt}),月令下${x.se[0]}${x.kong ? ",落空亡" : ""}。${x.where === "末传" ? "居末传,主结果有此象" : x.where === "初传" ? "居初传,主起因即有此象" : "居中传,主过程涉及此象"}。`,
          )
          .join("\n"),
        tone: score >= 1.5 ? "good" : score <= -1.5 ? "bad" : "mid",
        basis: "用神入传/入课",
      });
    } else {
      score -= 1.2;
      yi.push({
        k: `用神 · ${yongRel}`,
        t: `所问之事的用神“${yongRel}”既不入三传,也不在四课上神中出现:传统称“用神不现”,事缺根基或不在你的着力点上,常需借外力/外象或另择角度。`,
        tone: "bad",
        basis: "用神未现",
      });
    }
    if (T.med) {
      const md = [];
      lr.chu.forEach((c, i) => {
        if (lrRelOf(lr, c.z) === T.med) md.push(["初传", "中传", "末传"][i] + zn(c.z));
      });
      yi.push({
        k: `医药 · ${T.med}`,
        t: md.length
          ? `子孙(医药)入${md.join("、")}:有救助与化解之象,主有药有医、可制官鬼(病)。`
          : "子孙不入三传:化解之力不显,宜多找专业医生与多方调治。",
        tone: md.length ? "good" : "mid",
        basis: "制鬼之神",
      });
      if (md.length) score += 1;
    }
  }
  // 天将类神
  if (T.jiang.length) {
    const found = [];
    lr.chu.forEach((c, i) => {
      if (T.jiang.includes(c.gen)) found.push(`${["初", "中", "末"][i]}传${c.gen}(${zn(c.z)})`);
    });
    lr.ke.forEach((k, i) => {
      if (T.jiang.includes(k.gen)) found.push(`${["一", "二", "三", "四"][i]}课${k.gen}`);
    });
    yi.push({
      k: `类神 · ${T.jiang.join("/")}`,
      t: found.length
        ? `${found.join("、")}:${topic === "求财" ? "青龙主财喜、太常主衣禄" : topic === "事业" ? "贵人主长官提携、青龙主进取" : topic === "婚姻" ? "六合主媒合、太阴主情缘暗合" : topic === "疾病" ? "白虎主重症血光、螣蛇主惊疑反复" : topic === "官司" ? "朱雀主口舌文书、白虎主刑伤" : topic === "学业" ? "朱雀主文章、贵人主考官、青龙主佳音" : "青龙主顺利、太常主平稳"}。`
        : "所需类神未入传课,此象不显。",
      tone: found.length && !T.risk ? "good" : found.length && T.risk ? "bad" : "mid",
      basis: "天将类象",
    });
    if (found.length) score += T.risk ? -0.8 : 0.6;
  }
  // 出行:驿马
  if (topic === "出行") {
    const ym = lr.yiMa,
      inChu = chuZ.includes(ym);
    yi.push({
      k: "驿马",
      t: `驿马在${zn(ym)}${inChu ? ",入三传:主动、有远行之象" : ",未入三传:出行动力不足或事不必行"}。初传${zn(lr.chu[0].z)}(${lr.chu[0].gen})为出发之象,末传${zn(lr.chu[2].z)}(${lr.chu[2].gen})为到达之象。${lr.chu[2].kong ? "末传空亡:目的地之事易落空。" : ""}`,
      tone: inChu ? "good" : "mid",
      basis: "驿马",
    });
    if (inChu) score += 1;
  }
  // 我方:日干上神
  const selfU = lr.ke[0].u,
    selfG = lr.ke[0].gen,
    selfSE = RM_SEASON(ZHI_WX[selfU], mb);
  const selfS =
    selfSE[1] * 0.5 +
    (LR_JIANG_G[selfG] === "吉" ? 0.6 : -0.6) +
    (lr.kong.includes(selfU) ? -0.8 : 0);
  yi.push({
    k: "我方 · 日干上神",
    t: `${zn(selfU)}(${WXN[ZHI_WX[selfU]]}),天将${selfG}(${LR_JIANG_G[selfG]}),月令下${selfSE[0]}${lr.kong.includes(selfU) ? ",空亡" : ""}。${TJ_BRIEF[selfG]}之象附于我身。`,
    tone: selfS >= 0.6 ? "good" : selfS <= -0.6 ? "bad" : "mid",
    basis: "日干上神",
  });
  score += selfS * 0.6;
  // 课体修正
  const adj =
    {
      元首: 0.8,
      重审: -0.3,
      知一: 0,
      涉害: -0.4,
      遥克: -0.3,
      昴星: -0.6,
      别责: -0.3,
      八专: -0.2,
      伏吟: -0.6,
      返吟: -0.6,
    }[lr.ge] || 0;
  score += adj;
  const lv = RM_LV(score);
  sec.push({ title: `用神分析:${topic}`, items: yi, note: T.desc });
  // 应期
  const yq = [];
  const mo = lr.chu[2].z;
  yq.push({
    k: "应期参考(仅为传统取法)",
    t: `末传为${zn(mo)},常取“逢${zn(mo)}日/月”或“冲末传之${zn((mo + 6) % 12)}日/月”为应;若用神或末传落空(${lr.kong.map(zn).join("、")}空),则取出空(旬后)或填实之时。近事多论日、时,远事论月、年。`,
    basis: "末传应期",
  });
  sec.push({
    title: "应期与提示",
    items: yq,
    note: "应期是传统占断里最不稳定的一环,不同派别取法不同,仅供参考。",
  });
  sum.push({
    tone: lv[1],
    text: `问「${topic}」:${lv[0]}(用神加权 ${score.toFixed(1)});课体「${lr.ge}」,三传${lr.chu.map((c) => zn(c.z) + c.gen).join("→")}。`,
  });
  sum.push({ tone: "mid", text: `课体要义:${(ge[1] || "").slice(0, 46)}…` });
  return { summary: sum, sections: sec, verdict: lv, score };
}

/* ---------------- 六爻 ---------------- */
const LY_TOPIC = {
  求财: { yong: "妻财", desc: "以妻财为用神;子孙为原神(生财),兄弟为忌神(劫财)" },
  事业: { yong: "官鬼", desc: "以官鬼为用神(职位、官府);妻财为原神,子孙为忌神(食伤克官)" },
  婚姻: { yong: "*", desc: "男以妻财、女以官鬼为用神;世为己、应为对方" },
  疾病: { yong: "官鬼", desc: "官鬼为病,子孙为药(制鬼);世爻为身,官鬼旺动者病势重", risk: true },
  官司: { yong: "官鬼", desc: "官鬼为官方/对手压力;世为己、应为对方,看谁得月日之助", risk: true },
  考试: { yong: "父母", desc: "父母为文书、考试;官鬼为原神(官生印),妻财为忌神(财坏印)" },
  子女: { yong: "子孙", desc: "子孙为子女或晚辈;父母为忌神(枭神)" },
  出行: { yong: "世", desc: "以世爻为己;看世是否得月日之助、是否受克、动静" },
  合作: { yong: "应", desc: "世为己、应为对方;看应爻旺衰与生克世的关系" },
};
const LY_LS = {
  青龙: "喜庆财福",
  朱雀: "口舌文书",
  勾陈: "迟滞牵连(土)",
  螣蛇: "惊疑虚诈",
  白虎: "伤灾争斗",
  玄武: "暗昧盗失",
};
function lyStrength(r, mb, dayB, moving) {
  let s = 0;
  const n = [];
  const mm =
    {
      月建: 2,
      "旺(同月建之气)": 1.5,
      "相(得月建所生)": 1,
      "休(生月建)": 0,
      "囚(克月建)": -0.6,
      "死(受月建克)": -1.2,
      月破: -2,
    }[r.season] || 0;
  s += mm;
  n.push(`月建下${r.season}`);
  let dayScore = 0;
  if (r.dayRel === "日辰临爻") {
    dayScore = 1.5;
    n.push("日辰临爻");
  } else if (r.dayRel === "日生") {
    dayScore = 1;
    n.push("得日辰生");
  } else if (r.dayRel === "日克") {
    dayScore = -1;
    n.push("受日辰克");
  } else if (r.dayRel && r.dayRel.startsWith("日冲")) {
    if (mm >= 1) {
      dayScore = 0.5;
      n.push("旺相逢日冲为暗动");
    } else {
      dayScore = -1;
      n.push("休囚逢日冲为日破");
    }
  }
  s += dayScore;
  if (r.kong) {
    const strong = mm >= 1 || r.moving || (r.dayRel && r.dayRel.startsWith("日冲"));
    if (strong) {
      s -= 0.3;
      n.push("旬空而不空(旺/动/冲)");
    } else {
      s -= 1.5;
      n.push("旬空");
    }
  }
  if (r.moving) {
    s += 0.5;
    n.push("发动");
    const c = r.change || "";
    if (c === "回头生" || c === "化进神") {
      s += 1;
      n.push(c);
    } else if (c === "回头克" || c === "化退神") {
      s -= 1.3;
      n.push(c);
    } else if (c.startsWith("化冲")) {
      s -= 0.6;
      n.push(c);
    } else if (c === "化合") {
      n.push("化合(合住)");
      s -= 0.2;
    } else if (c.startsWith("伏吟")) {
      s -= 0.4;
      n.push("动而不变");
    }
  }
  return { s, n };
}
function liuyaoReading(L, R, topic) {
  const T = LY_TOPIC[topic],
    mb = L.monthB,
    dayB = L.dayIdx % 12,
    sec = [],
    sum = [];
  const rows = L.rows,
    strength = rows.map((r) => lyStrength(r, mb, dayB));
  const zn = (z) => ZHI[z];
  // 卦体
  sec.push({
    title: "卦体总览",
    items: [
      {
        k: `本卦 ${L.info.name} → 变卦 ${L.moving.length ? L.info2.name : "(六爻安静)"}`,
        t: `${L.palName}(${WXN[L.palWx]})${L.pal.order}卦;世在第${L.shi}爻,应在第${L.ying}爻。${L.moving.length ? `发动之爻:${L.moving.map((i) => "第" + (i + 1) + "爻").join("、")}。` : "六爻皆静,以静卦断:重看用神旺衰与月日生克。"}\n卦象:${L.info.txt || ""}。`,
        basis: "装卦",
      },
      {
        k: "月建 · 日辰",
        t: `月建${zn(mb)}(${WXN[ZHI_WX[mb]]})、日辰${zn(dayB)}(${WXN[ZHI_WX[dayB]]})为断卦总纲:月建管全局旺衰,日辰管当下生克冲合。旬空${L.kong.map(zn).join("、")}。${
          L.rows.some((r) => r.season === "月破")
            ? "见月破之爻:" +
              L.rows
                .filter((r) => r.season === "月破")
                .map((r) => r.rel + zn(r.b))
                .join("、") +
              ",力量被破,遇合或值日则有救。"
            : ""
        }`,
        basis: "月建日辰",
      },
    ],
  });
  // 用神
  let yong = T.yong;
  if (yong === "*") yong = R.opt.gender === "M" ? "妻财" : "官鬼";
  const yl = [];
  let score = 0;
  let yIdx = null,
    yWx = null,
    yFu = false;
  if (yong === "世") {
    yIdx = L.shi - 1;
    yWx = rows[yIdx].wx;
  } else if (yong === "应") {
    yIdx = L.ying - 1;
    yWx = rows[yIdx].wx;
  } else {
    const list = rows.filter((r) => r.rel === yong);
    if (list.length) {
      // 首选发动者,其次得分高者
      list.sort(
        (a, b) => (b.moving ? 1 : 0) - (a.moving ? 1 : 0) || strength[b.i].s - strength[a.i].s,
      );
      yIdx = list[0].i;
      yWx = list[0].wx;
      if (list.length > 1)
        yl.push({
          k: "用神多现",
          t: `${yong}在卦中出现 ${list.length} 次(${list.map((r) => "第" + (r.i + 1) + "爻" + zn(r.b)).join("、")}),取${list[0].moving ? "发动者" : "力量最强者"}第${yIdx + 1}爻为主,其余为辅;多现时事情头绪多、宜先辨真假。`,
          basis: "用神多现",
        });
    } else {
      const fuRow = rows.find((r) => r.fu && r.fu.rel === yong);
      if (fuRow) {
        yFu = true;
        yIdx = fuRow.i;
        yWx = ZHI_WX[fuRow.fu.b];
      }
    }
  }
  if (yIdx === null) {
    yl.push({
      k: `用神 · ${yong}`,
      t: "用神既不上卦、亦无伏神可取(极少见):事无着落,宜改换角度重新起卦。",
      tone: "bad",
      basis: "用神缺",
    });
    score -= 2;
  } else if (yFu) {
    const f = rows[yIdx].fu;
    yl.push({
      k: `用神 · ${yong}(伏藏)`,
      t: `${yong}不上卦,伏于第${yIdx + 1}爻(${GAN[f.gan]}${zn(f.b)})之下。传统上“用神伏藏”主事未显、需待出现:伏神得月日生扶、飞神(第${yIdx + 1}爻${zn(rows[yIdx].b)})来生伏则有力;飞神克伏、伏神空破则难。此处以飞神对伏神的关系粗判:${RM_WXR(rows[yIdx].wx, ZHI_WX[f.b]) === "sheng" ? "飞来生伏,可出可成" : RM_WXR(rows[yIdx].wx, ZHI_WX[f.b]) === "ke" ? "飞来克伏,受制难出" : "飞伏同类,力量平和"}。`,
      tone: RM_WXR(rows[yIdx].wx, ZHI_WX[f.b]) === "ke" ? "bad" : "mid",
      basis: "伏神",
    });
    score -= 0.5;
    if (RM_WXR(rows[yIdx].wx, ZHI_WX[f.b]) === "sheng") score += 1;
    else if (RM_WXR(rows[yIdx].wx, ZHI_WX[f.b]) === "ke") score -= 1;
  } else {
    const r = rows[yIdx],
      st = strength[yIdx];
    score += st.s;
    yl.push({
      k: `用神 · ${yong}${yong === "世" || yong === "应" ? "" : "(第" + (yIdx + 1) + "爻)"}`,
      t: `${GAN[r.gan]}${zn(r.b)}${WXN[r.wx]},${r.ls}(${LY_LS[r.ls]})。\n状态:${st.n.join(";")}。综合力量值 ${st.s.toFixed(1)}。${r.moving ? `\n发动:变为${L.rows2[yIdx].rel}${zn(L.rows2[yIdx].b)},${r.change}。` : "\n静爻:力量取决于月日,不动则主稳。"}`,
      tone: st.s >= 1.2 ? "good" : st.s <= -1.2 ? "bad" : "mid",
      basis: "月建/日辰/空亡/动变",
    });
  }
  // 原神 忌神 仇神
  if (yWx !== null && yIdx !== null) {
    const gen = (yWx + 4) % 5,
      ke = (yWx + 3) % 5,
      chou = (gen + 3) % 5; // 生我者、克我者、克原神者
    const listBy = (wx) => rows.filter((r) => r.wx === wx && r.i !== yIdx);
    const info = (arr) =>
      arr
        .map((r) => {
          const s = lyStrength(r, mb, dayB);
          return `第${r.i + 1}爻${zn(r.b)}(${r.rel}${r.moving ? "·动" : "·静"},力量${s.s.toFixed(1)})`;
        })
        .join("、") || "不上卦";
    const yuan = listBy(gen),
      ji = listBy(ke),
      chouL = listBy(chou);
    let ys = 0;
    yuan.forEach((r) => {
      const s = lyStrength(r, mb, dayB).s;
      if (r.moving || s >= 1) ys += 0.8;
      if (s <= -1.2) ys -= 0.2;
    });
    ji.forEach((r) => {
      const s = lyStrength(r, mb, dayB).s;
      if (r.moving) ys -= 1.2;
      else if (s >= 1) ys -= 0.6;
    });
    chouL.forEach((r) => {
      if (r.moving) ys -= 0.3;
    });
    score += ys;
    yl.push({
      k: "原神 · 忌神 · 仇神",
      t: `原神(${WXN[gen]},生用神):${info(yuan)}\n忌神(${WXN[ke]},克用神):${info(ji)}\n仇神(${WXN[chou]},克原神):${info(chouL)}\n${ys >= 0.6 ? "原神得力而忌神不张:用神得助" : ys <= -0.6 ? "忌神发动或旺相:用神受制,阻力主要来自忌神所代表的人事" : "原、忌力量相当:助力与阻力并存"}。`,
      tone: ys >= 0.6 ? "good" : ys <= -0.6 ? "bad" : "mid",
      basis: "生克链",
    });
  }
  sec.push({ title: `用神分析:${topic}`, items: yl, note: T.desc });
  // 世应
  const sr = rows[L.shi - 1],
    yr = rows[L.ying - 1],
    ss = lyStrength(sr, mb, dayB).s,
    ysY = lyStrength(yr, mb, dayB).s;
  const rw = RM_WXR(sr.wx, yr.wx);
  const rwTxt = {
    same: "世应同类:对等、同路",
    sheng: "世生应:我方付出、被消耗",
    ke: "世克应:我可掌控对方",
    beisheng: "应生世:对方有助于我",
    beike: "应克世:对方强、压制我",
  }[rw];
  sec.push({
    title: "世应(我与对方)",
    items: [
      {
        k: "世爻(己)",
        t: `第${L.shi}爻 ${GAN[sr.gan]}${zn(sr.b)}${WXN[sr.wx]}·${sr.rel}·${sr.ls}:${lyStrength(sr, mb, dayB).n.join(";")}(力量 ${ss.toFixed(1)})。`,
        tone: ss >= 1 ? "good" : ss <= -1 ? "bad" : "mid",
        basis: "世爻",
      },
      {
        k: "应爻(彼/事)",
        t: `第${L.ying}爻 ${GAN[yr.gan]}${zn(yr.b)}${WXN[yr.wx]}·${yr.rel}·${yr.ls}:${lyStrength(yr, mb, dayB).n.join(";")}(力量 ${ysY.toFixed(1)})。`,
        tone: ysY >= 1 ? "good" : ysY <= -1 ? "bad" : "mid",
        basis: "应爻",
      },
      {
        k: "世应关系",
        t: `${rwTxt}。${ss - ysY >= 1.5 ? "世强应弱,主动权在我" : ss - ysY <= -1.5 ? "应强世弱,对方占优" : "双方力量接近"}。`,
        tone: ["beisheng", "ke"].includes(rw) ? "good" : rw === "beike" ? "bad" : "mid",
        basis: "世应五行",
      },
    ],
  });
  if (yong === "世" || yong === "应") {
    score += (yong === "世" ? ss : ysY) * 0.0;
  }
  if (topic === "出行" || topic === "合作") {
    if (rw === "beisheng") score += 0.8;
    else if (rw === "beike") score -= 0.8;
    else if (rw === "ke") score += 0.3;
  }
  // 动爻
  if (L.moving.length) {
    sec.push({
      title: "动爻解析(事之所由动)",
      items: L.moving.map((i) => {
        const r = rows[i],
          r2 = L.rows2[i];
        const isY = i === yIdx;
        return {
          k: `第${i + 1}爻动 · ${r.rel}${zn(r.b)}→${r2.rel}${zn(r2.b)}`,
          t: `${r.ls}(${LY_LS[r.ls]})。${r.change}${isY ? ";此爻即用神" : ""}。${r.change === "回头生" ? "动而化出生助,有增益之象" : r.change === "回头克" ? "动而被变爻所克,自身受伤,主中途受挫" : r.change === "化进神" ? "向前发展、进展顺利" : r.change === "化退神" ? "后退收缩、势头减弱" : r.change === "化合" ? "被合住,动而不动,事有牵绊" : r.change.startsWith("化冲") ? "变爻冲之,主反复变更" : "力量转化,依生克而定"}。`,
          tone: ["回头生", "化进神"].includes(r.change)
            ? "good"
            : ["回头克", "化退神"].includes(r.change) || r.change.startsWith("化冲")
              ? "bad"
              : "mid",
          basis: "动变生克",
        };
      }),
    });
  }
  // 六神与应期
  const yy = yIdx !== null ? rows[yIdx] : null;
  const yq = [];
  if (yy && !yFu) {
    const b = yy.b,
      he = [
        [0, 1],
        [2, 11],
        [3, 10],
        [4, 9],
        [5, 8],
        [6, 7],
      ].find((p) => p.includes(b));
    const hb = he ? (he[0] === b ? he[1] : he[0]) : null;
    let hint = "";
    if (yy.kong && !yy.moving) hint = `用神旬空:多取出空(旬后)或填实(逢${zn(b)}日/月)之时`;
    else if (yy.moving)
      hint = `用神发动:多取逢合(${hb !== null ? zn(hb) : ""})或逢值(${zn(b)})之时`;
    else hint = `用神安静:多取逢冲(${zn((b + 6) % 12)})或逢值(${zn(b)})之时`;
    yq.push({
      k: "应期参考(仅为传统取法)",
      t: `${hint}。近事看日、远事看月年;若忌神发动,则待其被制(逢其冲/合)之时,用神方得舒展。`,
      basis: "用神地支",
    });
  }
  yq.push({
    k: "六神提示",
    t: yy
      ? `用神临${yy.ls}:${LY_LS[yy.ls]}。${yy.ls === "青龙" ? "喜庆与顺利之象。" : yy.ls === "白虎" ? "需防冲突、伤灾与强硬对手。" : yy.ls === "螣蛇" ? "需防虚惊、反复与多疑。" : yy.ls === "玄武" ? "需防隐情、欺瞒与暗中损耗。" : yy.ls === "朱雀" ? "消息、文书、口舌多。" : "牵绊迟滞,事进展缓。"}`
      : "用神不明,六神提示从略。",
    basis: "六神",
  });
  sec.push({
    title: "应期与六神",
    items: yq,
    note: "六爻断卦以用神为核心,应期与六神为辅助,均属传统象法,宜结合实际判断。",
  });
  const lv = RM_LV(score);
  sum.push({
    tone: lv[1],
    text: `问「${topic}」:${lv[0]}(综合 ${score.toFixed(1)});用神${yong}${yy ? `落第${yy.i + 1}爻(${zn(yy.b)}${WXN[yy.wx]})` : "未上卦"}${yFu ? "(伏藏)" : ""}。`,
  });
  sum.push({
    tone: "mid",
    text: `${L.info.name}${L.moving.length ? "→" + L.info2.name : ""};${rwTxt.split(":")[0]},月建${zn(mb)}日辰${zn(dayB)}。`,
  });
  return { summary: sum, sections: sec, verdict: lv, score };
}

/* ---------------- 梅花易数 ---------------- */
function meihuaReading(R, topic) {
  const mh = R.mh,
    mb = R.bz.pill[1].b,
    sec = [],
    sum = [];
  const tiWx = TRI[mh.ti].wx,
    yongWx = TRI[mh.yong].wx;
  const seas = (wx) => RM_SEASON(wx, mb);
  const tiS = seas(tiWx);
  const rel = (w) => RM_WXR(tiWx, w); // 体相对该五行:体生→'sheng' ...
  const relTxt = {
    same: ["比和", "吉", "同气相助,平顺"],
    beisheng: ["生体", "吉", "来生我,得助得益"],
    sheng: ["体生", "平", "我生之,泄耗、付出"],
    ke: ["体克", "平", "我克之,可得但费力"],
    beike: ["克体", "凶", "受克制,阻力压力"],
  };
  const score1 = (x) => ({ same: 1, beisheng: 2, ke: 0.5, sheng: -0.8, beike: -2 })[x];
  // 主卦
  const r1 = rel(yongWx);
  const flow = [];
  flow.push({
    k: `主卦 ${mh.ben.name}(事之开端)`,
    t: `${mh.ben.txt || ""}。体卦${TRI[mh.ti].n}(${TRI[mh.ti].img},${WXN[tiWx]})代表你自己,月令下${tiS[0]};用卦${TRI[mh.yong].n}(${TRI[mh.yong].img},${WXN[yongWx]})代表所占之事。关系:${relTxt[r1][0]}——${relTxt[r1][2]}。`,
    tone: relTxt[r1][1] === "吉" ? "good" : relTxt[r1][1] === "凶" ? "bad" : "mid",
    basis: "体用五行",
  });
  // 互卦
  const huU = TRI[mh.hu.up].wx,
    huL = TRI[mh.hu.lo].wx;
  const hs = [rel(huU), rel(huL)];
  const s2 = (score1(hs[0]) + score1(hs[1])) / 2;
  flow.push({
    k: `互卦 ${mh.hu.name}(事之过程)`,
    t: `互卦上${TRI[mh.hu.up].n}(${WXN[huU]})${relTxt[hs[0]][0]}、下${TRI[mh.hu.lo].n}(${WXN[huL]})${relTxt[hs[1]][0]}。${s2 >= 1 ? "过程中助力多、进展较顺" : s2 <= -1 ? "过程中阻力多、宜准备应对" : "过程中助力与阻力并存"}。互卦为“中间的暗线”,常反映事情内里的曲折。`,
    tone: s2 >= 1 ? "good" : s2 <= -1 ? "bad" : "mid",
    basis: "互卦对体",
  });
  // 变卦
  const bianYong = mh.inLower ? mh.bian.lo : mh.bian.up,
    bwx = TRI[bianYong].wx;
  const r3 = rel(bwx);
  flow.push({
    k: `变卦 ${mh.bian.name}(事之结果)`,
    t: `${mh.bian.txt || ""}。变出之用卦为${TRI[bianYong].n}(${TRI[bianYong].img},${WXN[bwx]}),对体:${relTxt[r3][0]}——${relTxt[r3][2]}。变卦为结果与趋势,权重与主卦相当。`,
    tone: relTxt[r3][1] === "吉" ? "good" : relTxt[r3][1] === "凶" ? "bad" : "mid",
    basis: "变卦对体",
  });
  sec.push({
    title: "三卦推演:起 → 承 → 合",
    items: flow,
    note: "梅花以体用生克为主线:体为己、用为事;主卦看开端、互卦看过程、变卦看结果。",
  });
  // 旺衰
  const yS = seas(yongWx);
  const ws = [
    {
      k: "体卦旺衰",
      t: `体卦${WXN[tiWx]}在${ZHI[mb]}月${tiS[0]}:${tiS[1] >= 0.7 ? "得令有力,承事之力足" : tiS[1] <= -0.6 ? "失令乏力,即使用卦有利也难承接" : "力量中平"}。`,
      tone: tiS[1] >= 0.7 ? "good" : tiS[1] <= -0.6 ? "bad" : "mid",
      basis: "月令",
    },
    {
      k: "用卦旺衰",
      t: `用卦${WXN[yongWx]}在${ZHI[mb]}月${yS[0]}:${yS[1] >= 0.7 ? "事势旺盛,力量大(克体时更凶,生体时更吉)" : yS[1] <= -0.6 ? "事势偏弱,力量小(克体时可减凶,生体时助力有限)" : "事势平和"}。`,
      tone: "mid",
      basis: "月令",
    },
  ];
  sec.push({ title: "旺衰", items: ws });
  // 汇总
  let score = score1(r1) * 0.4 + s2 * 0.2 + score1(r3) * 0.4;
  if (tiS[1] >= 0.7) score += 0.5;
  else if (tiS[1] <= -0.6) score -= 0.5;
  if (topic === "求财") {
    if (r1 === "ke" || r3 === "ke") score += 1;
    if (r1 === "beike" || r3 === "beike") score -= 0.5;
  }
  if (topic === "求名" || topic === "事业") {
    if (r1 === "beisheng") score += 0.5;
  }
  const lv = RM_LV(score * 1.4);
  const nA = TRI[mh.up].n,
    num = { 乾: 1, 兑: 2, 离: 3, 震: 4, 巽: 5, 坎: 6, 艮: 7, 坤: 8 };
  const shu = (num[TRI[mh.up].n] || 0) + (num[TRI[mh.lo].n] || 0);
  sec.push({
    title: "综合与应期",
    items: [
      {
        k: "综合倾向",
        t: `${lv[0]}(加权 ${score.toFixed(1)})。起→承→合:${relTxt[r1][0]} → ${s2 >= 0.5 ? "助" : s2 <= -0.5 ? "阻" : "平"} → ${relTxt[r3][0]}。${topic === "求财" ? "求财以“体克用”“用生体”为吉,“体生用”为耗。" : topic === "事业" || topic === "求名" ? "求名求官,以“用生体”“比和”为佳。" : "体用有利、互变不逆,则事可期;体受克或体卦失令,则宜缓图。"}`,
        tone: lv[1],
        basis: "三卦加权",
      },
      {
        k: "应期参考(仅为传统取法)",
        t: `常以卦数(上卦${num[TRI[mh.up].n]}+下卦${num[TRI[mh.lo].n]}=${shu})为“日/月/年”的数;或取体卦得生扶之月、克体之卦被制之时。近事取日,远事取月。`,
        basis: "先天数",
      },
    ],
    note: "梅花易数的“外应”(起卦时所见所闻)也是重要依据,本页无法判断,请自行参考。",
  });
  sum.push({
    tone: lv[1],
    text: `${mh.ben.name}→${mh.hu.name}→${mh.bian.name}:体用${relTxt[r1][0]},互卦${s2 >= 0.5 ? "助" : s2 <= -0.5 ? "阻" : "平"},变卦${relTxt[r3][0]};综合${lv[0]}。`,
  });
  return { summary: sum, sections: sec, verdict: lv, score };
}

/* ---------------- 玄空飞星 ---------------- */
const XK_PAIR = {
  16: ["一六共宗", "吉", "金水相生,主文名、科甲、贵人;当运时尤佳"],
  14: ["一四同宫", "吉", "水木相生,主文昌、学业;失运则易生桃花之扰"],
  25: ["二五交加", "凶", "病符遇灾煞,主重病、损耗,为最凶之组合,宜静勿动"],
  23: ["斗牛煞", "凶", "二黑土遇三碧木受克,主是非、官非、争讼"],
  37: ["穿心煞", "凶", "七赤金克三碧木,主盗劫、破财、口舌与外伤"],
  67: ["交剑煞", "凶", "金金相争,主刀伤、争斗与法律纠纷"],
  79: ["火烧天门", "凶", "九紫火克七赤金,主火灾、血光、心血管与肺部问题"],
  59: ["毒药煞", "凶", "五黄遇九紫,主中毒、癌症之类重症之象,宜远离与静守"],
  68: ["六八生助", "吉", "八白土生六白金,武曲与左辅同辉,主财与权,稳定有力"],
  89: ["八九喜庆", "吉", "九紫火生八白土,主喜庆、财与名声(九运时尤佳)"],
  55: ["双五黄", "凶", "五黄叠加,灾煞加倍,宜彻底静守"],
};
const XK_STAR_WX = { 1: 4, 2: 2, 3: 0, 4: 0, 5: 2, 6: 3, 7: 3, 8: 2, 9: 1 };
const XK_QI_SC = { 当旺: 2, 生气: 1, 退气: -0.5, 衰死: -1.5 };
function xkPairInfo(a, b) {
  const k = [a, b].sort().join(""),
    sp = XK_PAIR[k];
  if (sp) return { n: sp[0], t: sp[1], d: sp[2], sc: sp[1] === "吉" ? 1.5 : -1.8 };
  if (a + b === 10)
    return { n: "合十", t: "吉", d: "两星之数相加为十(阴阳交泰),主和谐与生机", sc: 1 };
  const wa = XK_STAR_WX[a],
    wb = XK_STAR_WX[b],
    r = RM_WXR(wa, wb);
  if (r === "sheng" || r === "beisheng")
    return { n: "相生", t: "吉", d: `${WXN[wa]}与${WXN[wb]}相生,气流通顺`, sc: 0.5 };
  if (r === "ke" || r === "beike")
    return { n: "相克", t: "凶", d: `${WXN[wa]}与${WXN[wb]}相克,气有冲突`, sc: -0.5 };
  return { n: "比和", t: "平", d: "同气叠加,力量集中", sc: 0 };
}
function xuankongReading(X, yun, fy, yearStar) {
  const sec = [],
    sum = [];
  const yf = xkFly(yearStar, true);
  const rows = [];
  const YN = { 2: "坤", 3: "震", 4: "巽", 6: "乾", 7: "兑", 8: "艮", 9: "离", 1: "坎", 5: "中" };
  // 格局
  const nt = X.notes.map((n) => ({
    k: n.n,
    t:
      {
        旺山旺向:
          "当运山星到坐山、向星到向首:传统称“丁财两旺”(山管人丁健康,向管财运)。宜保持坐山后有山/靠、向首见开阔或水的“形峦”,方能发挥。",
        上山下水:
          "山星入向、向星入坐:传统称“丁财两败”,须以形峦补救(坐后见水、向前见山之类),不宜单凭盘面下结论。",
        双星会向: "山、向星同到向首:当旺则旺财不旺丁,宜向前见水、避免向首见山。",
        双星会坐: "山、向星同到坐山:当旺则旺丁不旺财,宜坐后见山、避免坐后见水。",
        合十: "山向星和为十:阴阳合抱,和谐吉祥,但仍以当令与否为主。",
      }[n.n] || n.d,
    tone: n.t === "吉" ? "good" : n.t === "凶" ? "bad" : "mid",
    basis: "山向飞星",
  }));
  sec.push({
    title: `宅盘格局:${X.zuo}山${X.xiang}向 · ${["", "一", "二", "三", "四", "五", "六", "七", "八", "九"][yun]}运`,
    items: nt.length
      ? nt
      : [{ k: "无特殊格局", t: "坐向未成上述典型格局,以逐宫星曜及形峦为主。", tone: "mid" }],
    note: "玄空以“运、山、向”三盘论,吉凶还须结合外部形峦(山水道路)与内部布局,盘面只是起点。",
  });
  // 逐宫
  const pals = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((p) => {
    const c = X.cells[p],
      q1 = xkQi(c.shan, yun),
      q2 = xkQi(c.xiang, yun);
    const pr = xkPairInfo(c.shan, c.xiang);
    let sc = XK_QI_SC[q1] * 0.5 + XK_QI_SC[q2] * 0.5 + pr.sc;
    if (c.shan === 5 || c.xiang === 5) sc -= 1.5;
    if (c.shan === 2 || c.xiang === 2) sc -= 0.7;
    const ysStar = yf[p],
      ysI = XK_STAR_INFO[ysStar];
    const use =
      q2 === "当旺" || q2 === "生气"
        ? q1 === "当旺" || q1 === "生气"
          ? "山向皆得令:宜作主卧、书房、客厅等长时间停留处"
          : "向星得令:宜作客厅、大门、办公桌等“见财”之处"
        : q1 === "当旺" || q1 === "生气"
          ? "山星得令:宜作卧室、常坐常睡处(利健康与人丁)"
          : pr.t === "凶" || sc <= -1.5
            ? "星气不利:宜作储物、走道、卫浴等少停留处,避免久坐久睡"
            : "星气平和,可作一般使用";
    return { p, c, q1, q2, pr, sc, ysStar, ysI, use };
  });
  const items = pals.map((x) => ({
    k: `${XK_PAL_NAME[x.p]}${x.p === 5 ? "" : XK_PAL_DIR[x.p] ? "·" + XK_PAL_DIR[x.p] : ""} · 山${x.c.shan} 向${x.c.xiang} 运${x.c.yun}`,
    t: `山星${x.c.shan}(${XK_STAR_INFO[x.c.shan].n.slice(2)},${x.q1})、向星${x.c.xiang}(${XK_STAR_INFO[x.c.xiang].n.slice(2)},${x.q2})。组合「${x.pr.n}」:${x.pr.d}。\n流年星${x.ysStar}(${x.ysI.n.slice(2)}·${x.ysI.t}):${x.ysI.d}。\n使用建议:${x.use}。`,
    tone: x.sc >= 1.5 ? "good" : x.sc <= -1.5 ? "bad" : "mid",
    badge: `得分 ${x.sc.toFixed(1)}`,
    basis: "当令 × 组合 × 流年",
  }));
  sec.push({
    title: "九宫逐宫解读",
    items,
    collapse: true,
    note: "得分由山向星当令程度与两星组合机械叠加,仅示相对强弱。",
  });
  // 重点位置
  const cai = pals.find((x) => x.c.xiang === yun),
    ding = pals.find((x) => x.c.shan === yun);
  const kp = [];
  kp.push({
    k: "旺财位(向星当旺)",
    t: cai
      ? `${XK_PAL_NAME[cai.p]}宫(${XK_PAL_DIR[cai.p] || "中"})向星为当运之${yun},为“旺财位”:宜放在客厅、办公桌、大门朝向等经常活动之处,保持明亮、通畅。`
      : "向星当令星未落八宫外的位置。",
    tone: "good",
    basis: "向星=元运",
  });
  kp.push({
    k: "旺丁位(山星当旺)",
    t: ding
      ? `${XK_PAL_NAME[ding.p]}宫(${XK_PAL_DIR[ding.p] || "中"})山星为当运之${yun},为“旺丁位”:宜作卧室、书房,利健康、人丁与学业。`
      : "山星当令星未落八宫外的位置。",
    tone: "good",
    basis: "山星=元运",
  });
  const sh = pals.filter((x) => x.c.shan === 5 || x.c.xiang === 5 || x.ysStar === 5),
    er = pals.filter((x) => x.c.shan === 2 || x.c.xiang === 2 || x.ysStar === 2);
  kp.push({
    k: "五黄位",
    t: sh.length
      ? sh
          .map(
            (x) =>
              `${XK_PAL_NAME[x.p]}宫(${XK_PAL_DIR[x.p] || "中"}${x.ysStar === 5 ? ",流年五黄" : ""}${x.c.shan === 5 ? ",山星五" : ""}${x.c.xiang === 5 ? ",向星五" : ""})`,
          )
          .join("、") +
        "。五黄属土,传统宜静不宜动(避免动土、装修、重物撞击),以金属属性物(铜、金属摆件)泄土气为常见做法。"
      : "盘中五黄未落于常用八宫。",
    tone: "bad",
    basis: "五黄",
  });
  kp.push({
    k: "二黑位",
    t: er.length
      ? er
          .map(
            (x) =>
              `${XK_PAL_NAME[x.p]}宫(${XK_PAL_DIR[x.p] || "中"}${x.ysStar === 2 ? ",流年二黑" : ""})`,
          )
          .join("、") + "。二黑病符,传统宜保持通风整洁、少设卧榻,金属性物件可泄其土气。"
      : "盘中二黑未落于常用八宫。",
    tone: "bad",
    basis: "二黑",
  });
  const dsrc = yearStar;
  kp.push({
    k: `${fy}年流年(${["", "一白", "二黑", "三碧", "四绿", "五黄", "六白", "七赤", "八白", "九紫"][dsrc]}入中)`,
    t: `流年紫白落各宫见上表“流年星”。流年吉凶星只管一年,而山向盘管长期;故宜“年内避五黄二黑、年年更新布局”。`,
    basis: "流年飞星",
  });
  sec.push({ title: "重点位置与年度提醒", items: kp });
  const top = pals.filter((x) => x.p !== 5).sort((a, b) => b.sc - a.sc);
  sum.push({
    tone: "good",
    text: `${X.zuo}山${X.xiang}向:${X.notes.map((n) => n.n).join("、") || "无特殊格局"}。较得力的宫位:${top
      .slice(0, 2)
      .map((x) => XK_PAL_NAME[x.p] + "宫")
      .join("、")};宜避免久处:${top
      .slice(-2)
      .map((x) => XK_PAL_NAME[x.p] + "宫")
      .join("、")}。`,
  });
  if (sh.length)
    sum.push({
      tone: "bad",
      text: `五黄在${sh.map((x) => XK_PAL_NAME[x.p] + "宫").join("、")}:宜静勿动。`,
    });
  return { summary: sum, sections: sec };
}

/* =====================================================================
   个人指南引擎:综合八字(为主)与紫微(为辅)的“优势 · 短板 · 补益 · 化解 · 近远期指南 · 行动清单”
   思路:传统命理讲“扶抑、通关、调候”,落到今天可用的语言就是——发挥优势、补齐短板、调整环境与习惯、择时而动。
   这里的“化解”只给行为、环境、时机层面的建议,不涉及任何需要付费的仪式或迷信手段。
   声明:结论都是基于结构的倾向性描述,不是对命运的断言;重大决定请以现实条件与专业意见为准。
   ===================================================================== */
const GD_WX = {
  木: {
    dir: "东方",
    col: "青绿",
    season: "春",
    tp: "散步、亲近植物与自然、伸展拉筋、阅读学习、规划与成长类事务",
    food: "酸味适度、绿叶蔬菜,护肝",
    ind: BZ_IND["木"],
    trait: "生发、进取、规划力",
    org: BZ_ORG["木"],
    hab: "早睡早起、户外晨练、每天留出学习成长的固定时间",
  },
  火: {
    dir: "南方",
    col: "红紫橙",
    season: "夏",
    tp: "社交、表达、运动出汗、参加活动、展示自己、培养热情",
    food: "苦味适度、红色食物,护心",
    ind: BZ_IND["火"],
    trait: "热情、表现力、感染力",
    org: BZ_ORG["火"],
    hab: "午间小憩、主动表达与展示、保持光照与运动",
  },
  土: {
    dir: "中央/本地",
    col: "黄棕米",
    season: "长夏",
    tp: "规律作息、整理收纳、稳定的日程、园艺、烹饪、做有始有终的事",
    food: "甘味适度、根茎与谷物,护脾胃",
    ind: BZ_IND["土"],
    trait: "稳重、包容、执行的持续性",
    org: BZ_ORG["土"],
    hab: "三餐规律、固定的整理与复盘、遇事不急着表态",
  },
  金: {
    dir: "西方",
    col: "白金灰",
    season: "秋",
    tp: "断舍离、规则与流程、专业训练、法律财务、果断决策、呼吸与有氧",
    food: "辛味适度、白色食物,护肺",
    ind: BZ_IND["金"],
    trait: "果决、原则、边界感",
    org: BZ_ORG["金"],
    hab: "定期清理物品与关系、设立底线与规矩、练习呼吸",
  },
  水: {
    dir: "北方",
    col: "黑蓝深灰",
    season: "冬",
    tp: "静思、写作、旅行、学习新知、休整与睡眠、积累人脉信息",
    food: "咸味适度、黑色食物,护肾",
    ind: BZ_IND["水"],
    trait: "灵活、智慧、流动与适应",
    org: BZ_ORG["水"],
    hab: "保证睡眠、定期独处反思、多饮水、保持信息输入",
  },
};
const GD_TG_YEAR = {
  // 流年天干十神:主题 / 宜 / 忌
  比肩: [
    "自我、同辈、合作与竞争",
    "宜稳固自身、结交同行、独立开拓",
    "忌与人争利、合伙不明账目、盲目攀比",
  ],
  劫财: ["竞争、破耗、义气用事", "宜行动力与拼搏、守住现金流", "忌借贷担保、冲动投资、与人斗气"],
  食神: [
    "才艺、享受、表达与福气",
    "宜输出作品、学习技能、经营生活、调养身体",
    "忌怠惰放纵、饮食无度",
  ],
  伤官: [
    "才华、变革、口舌与突破",
    "宜创新突破、表达展示、技术创造",
    "忌顶撞上级、口无遮拦、与规则硬碰",
  ],
  偏财: [
    "机会、人脉、外来资源",
    "宜拓展渠道、把握机会、合理投资",
    "忌盲目押注、感情不专、开销失控",
  ],
  正财: [
    "稳定收入、务实经营、家庭责任",
    "宜稳步积累、经营本业、置产储蓄",
    "忌过度保守错失机会、因小失大",
  ],
  七杀: [
    "压力、挑战、突发事件与担当",
    "宜迎难而上、突破舒适圈、建立危机预案",
    "忌硬碰硬、情绪化决策、与小人纠缠",
  ],
  正官: [
    "规范、职位、责任与名誉",
    "宜守规矩、争取晋升与资质认证、履行责任",
    "忌违规、拖延职责、自我束缚过度",
  ],
  偏印: [
    "偏门学问、直觉与孤独感",
    "宜研究钻研、学习冷门技能、独处沉淀",
    "忌多疑封闭、想得多做得少",
  ],
  正印: ["学习、贵人、荣誉与休养", "宜进修考证、寻求前辈指点、休整充电", "忌依赖、拖延、被动等待"],
};
const GD_FIX = {
  // 化解思路:对应“经典组合”
  官杀混杂:
    "通关与取舍:让“食伤制杀留官”或“印星化杀”起作用——具体是:明确一条主线(要么走规范体系、要么走开拓路线),减少多头受制;多借专业与资质(印)化解压力,避免同时面对多个“上级”。",
  伤官见官:
    "以印制伤、以财通关:把才华转化为可交付的成果(财),同时补充学识与前辈指导(印)来约束锋芒;与权威沟通用“方案+数据”而非情绪。",
  枭神夺食:
    "制枭护食:行动上“少想多做”,固定输出节奏(每天写、练、做);多接触偏财类事务(实务、人脉)来打破空想。",
  财多身弱:
    "扶身为先:先强化自身(学习、健康、资质、贵人),再谈扩张;分拆目标、控制杠杆,避免“机会多但担不起”。",
  比劫争财:
    "以官杀或食伤化解:明确分工与规则(制度化),合伙先谈清权责与退出;用输出(食伤)转移竞争性精力。",
  印多身滞: "以财制印、以食伤泄秀:减少准备期、尽快小步试错;把所学立刻转成作品或实践。",
  食伤泄身: "以印补给、以比劫帮身:控制输出节奏、多休整与学习充电,避免过度透支;找可靠搭档分担。",
  杀重无制: "食伤制杀或印化杀:训练专业硬实力(食伤),并借助长辈、导师(印)承接压力;避免孤军应对。",
  财星混杂: "专一取舍:财路与感情都宜“主次分明”,避免多线并进导致精力分散。",
  刃无官杀: "自设规则:以纪律、流程与外部监督约束冲动,遇大事“冷静24小时”。",
};
const GD_REL_FIX = {
  冲: "“冲”宜以“稳”对之:遇到冲动之年/月,少做不可逆的大决定,先做预案与备选;冲的是哪一柱,就多留意该柱所主的人事(年=家庭背景、月=事业/父母、日=自身/配偶、时=子女/下属)。",
  刑: "“刑”多主摩擦与内耗:把规则和边界写清楚、把沟通做在前面,避免“小事拖成大事”。",
  害: "“害”主暗中的不顺:保持信息透明,减少猜测与传话。",
  破: "“破”主局部损耗:关键计划留出容错与备份。",
};
const GD_ORDER = {
  ten: ["比肩", "劫财", "食神", "伤官", "偏财", "正财", "七杀", "正官", "偏印", "正印"],
};
function gdLv(sc) {
  return sc >= 0.85 ? "吉" : sc >= 0.3 ? "小吉" : sc > -0.3 ? "平" : sc > -0.85 ? "小凶" : "凶";
}
function gdTone(lv) {
  return lv.includes("吉") ? "good" : lv.includes("凶") ? "bad" : "mid";
}

function guideReading(R, nowY) {
  const bz = R.bz,
    D = R.deep,
    zw = R.zw,
    lunar = R.lunar,
    gender = R.opt.gender,
    now = nowY || nowBJ().y;
  const tg = bzTenGods(bz),
    pats = bzPatterns(bz, D, tg),
    dm = GAN[bz.dm];
  const groups = {
    比劫: bzG(tg, ["比肩", "劫财"]),
    食伤: bzG(tg, ["食神", "伤官"]),
    财: bzG(tg, ["正财", "偏财"]),
    官杀: bzG(tg, ["正官", "七杀"]),
    印: bzG(tg, ["正印", "偏印"]),
  };
  const P = BZ_DM[dm],
    sec = [],
    sum = [];
  // ---------- 优势 ----------
  const pros = [];
  pros.push({
    k: `日主底色 · ${dm}${WXN[GAN_WX[bz.dm]]}(${P[0]})`,
    t: `${P[1].split(";")[0]}。这是你最自然的“出厂设置”,把它放到合适的环境里,就是最省力的发力方式。`,
    basis: "日干取象",
  });
  Object.entries(groups)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([g, v]) => {
      const map = {
        比劫: ["自我力量与同伴", "独立、抗压、义气,适合团队与并肩作战"],
        食伤: ["表达与创造", "才华、口才与创意,适合内容、技术与创作型工作"],
        财: ["务实与资源", "对资源、机会与现实敏感,适合经营与运营"],
        官杀: ["责任与规则", "担当、组织性强,适合管理、体制与挑战型岗位"],
        印: ["学习与贵人", "学习力、领悟力与贵人缘,适合研究与专业积累"],
      }[g];
      if (v >= 1.2)
        pros.push({
          k: `突出优势 · ${map[0]}(${g}${v.toFixed(1)})`,
          t: map[1] + "。",
          tone: "good",
          basis: "十神结构",
        });
    });
  pats
    .filter((x) => x.t === "吉")
    .forEach((x) => pros.push({ k: `有利结构 · ${x.n}`, t: x.d, tone: "good", basis: "八字组合" }));
  D.ss
    .filter((s) => s.tone === "吉")
    .slice(0, 4)
    .forEach((s) =>
      pros.push({
        k: `吉神 · ${s.n}(${s.where.join("")})`,
        t: (BZ_SS_DESC[s.n] || s.desc) + "。",
        tone: "good",
        basis: "神煞",
      }),
    );
  // 紫微强宫
  const strong = zw.pal
    .map((p) => ({ p, sc: zwPalScore(zw, p) }))
    .sort((a, b) => b.sc - a.sc)
    .slice(0, 3);
  strong.forEach((x) => {
    if (x.sc >= 1)
      pros.push({
        k: `紫微强宫 · ${x.p.name}`,
        t: `${x.p.name}星曜得力(倾向 ${zwLevel(x.sc)[0]}):${RD_PAL[x.p.name].th}方面较有底气,可作为发力点。`,
        tone: "good",
        basis: "紫微逐宫得分",
      });
  });
  sec.push({ title: "个人优势(可以放大的部分)", items: pros });
  // ---------- 短板 ----------
  const cons = [];
  const wk = Object.entries(groups)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2);
  wk.forEach(([g, v]) => {
    const map = {
      比劫: ["自我力量与同伴", "自主性与抗压偏弱、易受他人左右;宜练习表达立场、建立可靠同盟"],
      食伤: ["表达与创造", "输出偏少、想法不易外化;宜刻意练习表达、作品化"],
      财: ["资源与变现", "对资源与现实回报不敏感;宜学习记账、理财、把想法变现"],
      官杀: ["规则与担当", "自我约束、规范意识偏弱;宜设定制度、承担可量化的责任"],
      印: ["学习与靠山", "学习积累与贵人支持偏少;宜系统学习、主动寻找导师"],
    }[g];
    if (v < 1.2)
      cons.push({
        k: `偏弱面 · ${map[0]}(${g}${v.toFixed(1)})`,
        t: map[1] + "。",
        tone: "mid",
        basis: "十神结构",
      });
  });
  const top = Object.entries(groups).sort((a, b) => b[1] - a[1])[0];
  if (top[1] >= 2.6)
    cons.push({
      k: `过旺面 · ${top[0]}(${top[1].toFixed(1)})`,
      t:
        {
          比劫: "自我与同类力量过重:固执、竞争、分利,宜学会合作与让渡",
          食伤: "输出过盛:精力外泄、口舌是非,宜收敛节奏、补充学习与休整",
          财: "财与机会过多:分心、担不起,宜聚焦一两条主线",
          官杀: "压力与规则过重:自我束缚、焦虑,宜学会卸压与授权",
          印: "思虑与依赖过重:行动迟缓,宜小步试错、尽快落地",
        }[top[0]] + "。",
      tone: "mid",
      basis: "十神结构",
    });
  pats
    .filter((x) => x.t === "凶" || x.t === "平")
    .forEach((x) =>
      cons.push({
        k: `结构隐患 · ${x.n}`,
        t: x.d,
        tone: x.t === "凶" ? "bad" : "mid",
        basis: "八字组合",
      }),
    );
  const sorted = bz.wx.map((v, i) => ({ i, v })).sort((a, b) => a.v - b.v);
  if (sorted[0].v < 0.8)
    cons.push({
      k: `五行偏枯 · ${WXN[sorted[0].i]}(${sorted[0].v.toFixed(1)})`,
      t: `${WXN[sorted[0].i]}行力量极弱:对应的“${GD_WX[WXN[sorted[0].i]].trait}”是短板,身体上宜留意${GD_WX[WXN[sorted[0].i]].org}的保养。`,
      tone: "mid",
      basis: "五行分布",
    });
  D.rel
    .filter((r) => r.t !== "合")
    .slice(0, 3)
    .forEach((r) =>
      cons.push({ k: `相互作用 · ${r.txt}`, t: GD_REL_FIX[r.t] || "", tone: "bad", basis: r.k }),
    );
  D.ss
    .filter((s) => s.tone === "凶")
    .slice(0, 3)
    .forEach((s) =>
      cons.push({
        k: `需留意 · ${s.n}(${s.where.join("")})`,
        t: (BZ_SS_DESC[s.n] || s.desc) + "。",
        tone: "bad",
        basis: "神煞",
      }),
    );
  const weakP = zw.pal
    .map((p) => ({ p, sc: zwPalScore(zw, p) }))
    .sort((a, b) => a.sc - b.sc)
    .slice(0, 3);
  weakP.forEach((x) => {
    if (x.sc <= -1)
      cons.push({
        k: `紫微弱宫 · ${x.p.name}`,
        t: `${x.p.name}星曜受制(倾向 ${zwLevel(x.sc)[0]}):${RD_PAL[x.p.name].th}方面宜多用心经营、少凭直觉。`,
        tone: "bad",
        basis: "紫微逐宫得分",
      });
  });
  const jiP = zw.pal.find((p) => p.stars.some((s) => s.h === "忌"));
  if (jiP)
    cons.push({
      k: `生年化忌 · ${jiP.stars.find((s) => s.h === "忌").n}入${jiP.name}`,
      t: `${jiP.name}(${RD_PAL[jiP.name].th})是你的“执着点”,容易在此过度在意或受挫;把它当作长期功课去精进,而不是逃避。`,
      tone: "mid",
      basis: "紫微四化",
    });
  sec.push({
    title: "短板与隐患(需要留意的部分)",
    items: cons.length
      ? cons
      : [
          {
            k: "整体较均衡",
            t: "命局中没有特别突出的短板,重点是根据大运流年及时调整节奏。",
            tone: "good",
          },
        ],
  });
  // ---------- 补益 ----------
  const fav = D.xy.favor.map((x) => WXN[x]),
    av = D.xy.avoid.map((x) => WXN[x]);
  const mend = [];
  fav.forEach((w) => {
    const g = GD_WX[w];
    mend.push({
      k: `补益五行 · ${w}(用神)`,
      t: `方位:${g.dir};颜色:${g.col};季节:${g.season}(该季节更顺势)。\n生活习惯:${g.hab}。\n适合多做:${g.tp}。\n饮食倾向:${g.food}。\n职业方向(仅供参考):${g.ind}。\n所谓“补${w}”,本质是多接近它所代表的性质——${g.trait}。`,
      tone: "good",
      basis: "扶抑 + 调候",
    });
  });
  if (av.length)
    mend.push({
      k: `宜收敛 · ${av.join("、")}`,
      t: av
        .map(
          (w) =>
            `${w}(${GD_WX[w].trait}):在你这里已偏多或不宜再加强——少做“${GD_WX[w].tp.split("、")[0]}”类的过度投入,避免${GD_WX[w].org}的负担。`,
        )
        .join("\n"),
      tone: "mid",
      basis: "宜抑五行",
    });
  mend.push({
    k: "性格与行为层面的“补法”",
    t: (() => {
      const lvl = D.st.level;
      return lvl === "偏强" || lvl === "极强"
        ? "日主偏强:学会“泄”与“让”——把精力输出到作品、他人、公益或运动上;在决策前主动听取反对意见;避免以强硬方式处理关系。"
        : lvl === "偏弱" || lvl === "极弱"
          ? "日主偏弱:学会“借”与“养”——借团队、导师、平台的力;保证睡眠与体能;不要在状态低谷时做大决定;先建立小成就感再谈大目标。"
          : "日主中和:重点是把握节奏——顺势而为,在有利的大运流年积极行动,在不利时以稳为主。";
    })(),
    tone: "good",
    basis: "日主强弱",
  });
  sec.push({
    title: "补益与优化路径",
    items: mend,
    note: "“补五行”不是买什么摆件,而是多做具有该五行性质的事;方位与颜色只是环境暗示的辅助。",
  });
  // ---------- 化解 ----------
  const fix = [];
  pats.forEach((x) => {
    if (GD_FIX[x.n])
      fix.push({ k: `化解 · ${x.n}`, t: GD_FIX[x.n], tone: "good", basis: "通关/制化思路" });
  });
  {
    const seen = {};
    D.rel
      .filter((r) => r.t === "冲" || r.t === "刑")
      .forEach((r) => {
        if (seen[r.t]) return;
        seen[r.t] = 1;
        const all = D.rel
          .filter((x) => x.t === r.t)
          .map((x) => x.txt)
          .join("、");
        fix.push({ k: `化解 · ${r.t}(${all})`, t: GD_REL_FIX[r.t], tone: "good", basis: r.k });
      });
  }
  if (jiP)
    fix.push({
      k: `化解 · 化忌入${jiP.name}`,
      t: `不逃避、不放大:对${RD_PAL[jiP.name].noun}这件事,建立“每周固定复盘 + 只处理可控部分”的机制;可以把这块升级成你的专业能力,化忌为“专精”。`,
      tone: "good",
      basis: "紫微四化",
    });
  const kg = D.kong.map((z) => ZHI[z]).join("、");
  if (bz.pill.some((p, i) => i !== 2 && D.kong.includes(p.b)))
    fix.push({
      k: "化解 · 空亡",
      t: `落空亡的柱所主之事容易“想得到、做不到/迟到”。传统说法是“逢填实则出空”——落到实践就是:把这类事务设定明确的截止日期与外部承诺,用行动把它“填实”。空亡地支:${kg}。`,
      tone: "good",
      basis: "空亡",
    });
  if (!fix.length)
    fix.push({
      k: "当前无突出困局",
      t: "命局中没有需要特别化解的强冲突结构,保持稳步积累、在不利流年适度收缩即可。",
      tone: "good",
    });
  fix.push({
    k: "通用心法",
    t: "① 在“冲”的年份/月份,避免重大不可逆决定,先留预案与备选。\n② 在低谷期先保底(健康、现金流、关键关系),再谈突破。\n③ 与其“化解”外部,不如调整自己对事件的反应速度:先冷静再表态。\n④ 任何命理结论都不是定数;能改变的永远是下一次选择。",
    tone: "mid",
    basis: "通用",
  });
  sec.push({
    title: "化解困局(思路与做法)",
    items: fix,
    note: "“化解”在传统里讲究通关、制化与调候,落实到今天就是:调整结构性的短板、避开冲动的时机、把问题拆成可控的小步。",
  });
  // ---------- 个人运势(当下) ----------
  const dts = dayunTable(bz, D);
  const age = now - lunar.year + 1;
  let cur = -1;
  dts.forEach((d, i) => {
    if (age >= Math.floor(d.startAge)) cur = i;
  });
  const nowRows = [];
  if (cur >= 0) {
    const d = dts[cur],
      nx = dts[cur + 1];
    nowRows.push({
      k: `当前大运 · ${d.gz}(${Math.floor(d.startAge)}岁起)`,
      t: `十神「${d.ss}」,倾向「${d.lv}」。${GD_TG_YEAR[d.ss][0]}是这十年的背景色。${d.lv.includes("吉") ? "宜积极经营、扩大布局。" : d.lv.includes("凶") ? "宜稳守、整理、提升自己,避免激进扩张。" : "宜循序渐进、保持节奏。"}${nx ? `\n下一步:${Math.floor(nx.startAge)}岁进入${nx.gz}(${nx.ss},${nx.lv}),可提前在${Math.floor(nx.startAge) - 2}岁前后做过渡准备。` : ""}`,
      tone: gdTone(d.lv),
      badge: d.lv,
      basis: "大运 × 喜忌",
    });
  }
  const ly = liunian(bz, D, now, 1)[0],
    lm = liuyue(bz, D, now);
  const ti = GD_TG_YEAR[ly.ss];
  nowRows.push({
    k: `今年 · ${ly.y}${ly.gz}`,
    t: `十神「${ly.ss}」——${ti[0]}。倾向「${ly.lv}」${ly.notes.length ? "(" + ly.notes.join("、") + ")" : ""}。\n宜:${ti[1].replace(/^宜/, "")}。\n忌:${ti[2].replace(/^忌/, "")}。`,
    tone: gdTone(ly.lv),
    badge: ly.lv,
    basis: "流年 × 喜忌",
  });
  const n = nowBJ();
  const key = (o) => o.y * 10000 + o.m * 100 + o.d,
    curM =
      n.y === now || n.y === now + 1
        ? lm.reduce((a, m, i) => (key(n) >= key(m.from) ? i : a), -1)
        : -1;
  const good = lm
      .map((m, i) => ({ m, i }))
      .filter((x) => x.m.sc >= 0.3)
      .map((x) => `${x.m.name}月(${x.m.gz})`),
    bad = lm
      .map((m, i) => ({ m, i }))
      .filter((x) => x.m.sc <= -0.3)
      .map((x) => `${x.m.name}月(${x.m.gz})`);
  nowRows.push({
    k: `本年月度节奏`,
    t: `较顺月份:${good.join("、") || "—"};需谨慎的月份:${bad.join("、") || "—"}。${curM >= 0 ? `当前处于${lm[curM].name}月(${lm[curM].gz},${lm[curM].ss},${lm[curM].lv})。` : ""}\n(以节为界:立春、惊蛰、清明……为月首。)`,
    tone: "mid",
    basis: "流月 × 喜忌",
  });
  try {
    const dd = dayInfo(n.y, n.m, n.d),
      dgz = dd.dayIdx,
      ds = shishen(bz.dm, dgz % 10);
    const sc = scoreGZ(bz, D, dgz, 0.6, 0.4);
    nowRows.push({
      k: `今日 · ${dd.gz}日`,
      t: `今日天干对你是「${ds}」(${GD_TG_YEAR[ds][0]});倾向「${LV(sc.sc)}」${sc.notes.length ? "(" + sc.notes.join("、") + ")" : ""}。\n黄历建除「${dd.zx}」,${dd.ts}(${dd.huang ? "黄道" : "黑道"});宜:${dd.yi.slice(0, 6).join("、") || "诸事不宜"};忌:${dd.ji.slice(0, 6).join("、") || "—"}。`,
      tone: gdTone(LV(sc.sc)),
      badge: LV(sc.sc),
      basis: "日柱 × 日主",
    });
  } catch (e) {}
  sec.push({ title: "个人运势(当下)", items: nowRows });
  // ---------- 未来指南 ----------
  const fut = [];
  const ls = liunian(bz, D, now, 8);
  ls.forEach((x) => {
    const ti2 = GD_TG_YEAR[x.ss],
      a = x.y - lunar.year + 1;
    fut.push({
      k: `${x.y} ${x.gz}年(${a}岁)`,
      t: `主题:${ti2[0]}。\n宜:${ti2[1].replace(/^宜/, "")}。\n忌:${ti2[2].replace(/^忌/, "")}。${x.notes.length ? "\n触发:" + x.notes.join("、") + "。" : ""}${x.notes.some((n) => n.includes("冲")) ? "\n此年地支与命局相冲,重大变动(职、居、关系)宜有预案,不宜仓促。" : ""}`,
      tone: gdTone(x.lv),
      badge: x.lv,
      basis: "流年 × 喜忌",
      pal: x.y,
    });
  });
  sec.push({
    title: "未来八年指南",
    items: fut,
    collapse: true,
    note: "倾向值只反映“该年干支与你的喜忌是否同气、是否冲合日支月支”,并非事件预告。",
  });
  // 大运路径
  const path = dts
    .filter((d, i) => i >= Math.max(0, cur))
    .slice(0, 4)
    .map((d, i) => ({
      k: `${Math.floor(d.startAge)}–${Math.floor(d.startAge) + 9}岁 · ${d.gz}运(${d.ss})`,
      t: `${GD_TG_YEAR[d.ss][0]}。${d.lv.includes("吉") ? "顺势期:适合扩张、转型、投入长线目标。" : d.lv.includes("凶") ? "调整期:适合内修、整理、补短板,把风险控制在可承受范围。" : "平稳期:适合按既定路线深耕。"}${D.xy.favor.includes(GAN_WX[d.idx % 10]) ? `天干${GAN[d.idx % 10]}${WXN[GAN_WX[d.idx % 10]]}与取用同气,助力较明显。` : ""}`,
      tone: gdTone(d.lv),
      badge: d.lv,
      basis: "大运",
    }));
  sec.push({ title: "大运路径(未来 30–40 年)", items: path });
  // 紫微视角
  const zwRows = [];
  const zy = ziweiYears(zw, now, 5);
  zy.forEach((y) => {
    const lu = y.flies.find((f) => f.h === "禄"),
      ji = y.flies.find((f) => f.h === "忌");
    zwRows.push({
      k: `${y.y}(${y.age}岁)· 流年命宫落${y.palName}`,
      t: `流年禄:${lu.star}入${lu.pal}——该年机遇多在“${RD_PAL[lu.pal] ? RD_PAL[lu.pal].noun : ""}”;流年忌:${ji.star}入${ji.pal}——该年需谨慎处理“${RD_PAL[ji.pal] ? RD_PAL[ji.pal].noun : ""}”。`,
      basis: "流年四化落本命",
    });
  });
  sec.push({ title: "紫微视角 · 近五年重点", items: zwRows, collapse: true });
  // ---------- 行动清单 ----------
  const act = [];
  const f0 = fav[0] || "",
    gf = GD_WX[f0];
  act.push({
    k: "30 天内",
    t: `① 固定作息与睡眠,先稳住身体(${f0 ? `可结合${f0}行习惯:${gf.hab}` : ""})。\n② 写下你的“三项优势/三项短板”,各选一个动作:放大优势的一个动作、补短板的一个动作。\n③ 清理一件长期拖延的事(可用“空亡填实”的办法:定截止日期+外部承诺)。`,
    tone: "good",
    basis: "行动",
  });
  act.push({
    k: "90 天内",
    t: `① 围绕“${Object.entries(groups).sort((a, b) => b[1] - a[1])[0][0]}”这一强项设计一个可展示的成果(作品/项目/资质)。\n② 针对最弱的“${Object.entries(groups).sort((a, b) => a[1] - b[1])[0][0]}”,建立最小可行的练习(每周固定时段)。\n③ 依据流年提示安排大事的时间窗口(避开倾向为“凶/小凶”的月份做不可逆决定)。`,
    tone: "good",
    basis: "行动",
  });
  act.push({
    k: "一年内",
    t: `① 复盘本年“${ly.ss}”主题下的得失,写成一页纸。\n② 提前为下一步大运/流年的转折做准备:${cur >= 0 && dts[cur + 1] ? `${Math.floor(dts[cur + 1].startAge)}岁前后的过渡` : "下一个十年"}。\n③ 保持一个“低成本的试验田”——每年至少尝试一件新事,看是否与${fav.join("、")}的方向契合。`,
    tone: "good",
    basis: "行动",
  });
  sec.push({ title: "行动清单", items: act });
  // ---------- 总评 ----------
  sum.push({
    tone: "good",
    text: `底色:${dm}${WXN[GAN_WX[bz.dm]]}(${P[0]}),${D.st.level},${D.gj.name};主要优势:${Object.entries(
      groups,
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map((x) => x[0])
      .join("、")}。`,
  });
  sum.push({
    tone: "mid",
    text: `待补:${wk.map((x) => x[0]).join("、")};取用${fav.join("、")}${av.length ? "、宜收敛" + av.join("、") : ""}。`,
  });
  sum.push({
    tone: gdTone(ly.lv),
    text: `今年${ly.y}${ly.gz}(${ly.ss}):${ly.lv}。${ti_short(ly.ss)}`,
  });
  return { summary: sum, sections: sec };
}
function ti_short(ss) {
  const t = GD_TG_YEAR[ss];
  return `重心:${t[0].split("、")[0]};宜${t[1].replace(/^宜/, "").split("、")[0]}。`;
}

/* =====================================================================
   补充模块:择时(时辰黄黑道与宜忌)· 八宅命卦与方位 · 紫微小限与飞宫四化 · 六爻卦象补充 · 八字从格提示
   时辰宜忌数据取自传统历书体系(经开源历法库逐时对拍),按“日干支 × 时支”压缩。
   ===================================================================== */
const TIME_DATA = {
  items:
    "塑绘 斋醮 出行 拆卸 解除 修造 移徙 造船 入殓 除服 成服 移柩 启钻 修坟 立碑 谢土 无 月空 母仓 三合 天喜 天医 玉宇 除神 青龙 鸣吠 九坎 九焦 土符 大煞 五离 祭祀 沐浴 安床 纳财 畋猎 捕捉 开市 破土 月德合 金堂 明堂 河魁 大时 大败 咸池 订盟 纳采 祈福 动土 上梁 嫁娶 作灶 时阳 生气 五虚 九空 往亡 天刑 理发 补垣 塞穴 入宅 安葬 王日 游祸 血支 重日 朱雀 教牛马 馀事勿取 官日 敬安 金匮 鸣吠对 月建 小时 月厌 地火 造畜稠 会亲友 行丧 月恩 守日 不将 要安 土府 开光 出火 进人口 栽种 纳畜 探病 时德 相日 吉期 五合 劫煞 天贼 起基 交易 立券 挂匾 词讼 作梁 开池 安门 掘井 民日 天巫 福德 天仓 宝光 灾煞 天火 平治道涂 开仓 出货财 四相 天马 致死 月煞 月虚 白虎 安机械 盖屋 定磉 安香 置产 天德合 时阴 六仪 玉堂 厌对 招摇 死气 整手足甲 解神 月害 小耗 四废 天牢 破屋 坏垣 普护 月破 大耗 四击 八专 元武 阳破阴冲 牧养 阳德 五富 福生 司命 断蚁 造庙 天恩 临日 复日 勾陈 问名 冠笄 裁衣 天德 月德 圣心 天罡 月刑 竖柱 开柱眼 伐木 架马 阴德 驿马 天后 益后 六合 续世 天吏 四忌 六蛇 归忌 血忌 逐阵 触水龙 阳错 求医 治病 入学 扫舍 开生坟 合寿木 八风 求嗣 习艺 经络 地囊 结网 死神 安碓磑 放水 造仓 四耗 四穷 大会 阴错 合帐 天赦 天愿 诸事不宜 修饰垣墙 五墓 取渔 八龙 合脊 酬神 针灸 造车器 阴道冲阳 造桥 纳婿 赴任 孤辰 阴位 雕刻 行狠 了戾 开渠 开厕 岁薄 阴阳交破 绝阴 小会 纯阳 归岫 七鸟 割蜜 阳错阴冲 普渡 筑堤 天狗 分居 九虎 成日 孤阳 阴神 三丧 鬼哭 大退 四离 阴阳俱错 阴阳击冲 三阴 雇佣 乘船 天符 归宁 修门 七符 绝阳 纯阴 单阴 订婚 求财 见贵",
  yi: "丰伈丳严丿,丰仃丂伉丳丿丟,丟丰仙伈丳丂伉举丿仟,仃丳丆举严乤丅丿,伈丳伉严乤両,丰仃伈丳举严乤,丐,丟丰仙伉伊伈丳丅丿举,仃伈丳丂伉严乤両,伉伊仙丅乽丆临両举严,丂伉伊丳乙丆丿,仃丳丆举严乤丅丿丰,丰仃伈丳丂伉严乤両丟,丟丰仙伈丳丂伉举丿,伈丳丅举严乤丿,仟丂伉伊伈丳举严丿丰仃丟,丐,丰仃伈丳伉严乤両丅乽丆,仃丳举严乤丿伉,丐,丰仃丂伉丳仟伊,丰仃伈丳伉严乤両,丰伈丳両丆举丅丿,丟丰仃严伈丳举丿丅仟丂伊伉,仟丂伉伊丟仙,丅乽丆临両举严仟丂伉伊丳乙,仃丳丆举严乤丿丰,仟丂伉丳丅丆严丿,伈丳严丿,伉伊伈丳举严丿,丰仃伈丳丂伉严乤両,丅乽丆両举严乴丟丰仃丁伈丳丂,丐,丰仃伈丳伉严乤両举丿丟,伈丳丂伉严乤両临丟,丰仃伈丳伉严乤両丟,临丟丰丁仙,伊伉丳乙丆丿丟丰仃丁伈,伈丳両丆举丅丿伉伊,丅乽丆临両举严仃伈丳,丟丰仃丁伈丳丿,仃丳丆举严乤丅丿丰伈仟丂伊伉,丰仃伈丳丂伉严乤両仟,丰仃伈丳丂伉严乤両丅举丿丟,举丅丿丟丁仙,丐,丰仃伈丳伉严乤両伊,丰仃伈丳伉严乤両丟伊,仃伈丳伉严乤両,仙伉伊伈丳丿,仃丳丆举严乤丅丿临丟丰丁仙伊,伉伊,丰仃伈丳伉严乤両,仟丂伉伊伈丳举严乽丆临両,丅丿丂伉丳,丰仃丂举丳丅丿仟伊伉,丰仃伈丳丂伉严乤両仟伊,仃伈丳丂伉严乤両,丐,丅乽丆両举严乴伊伉伈丳乙,丟丰仙丂伉伊伈丳丅丿仟,丰仃伈丳伉严乤両丅乽丆,仟丂伉伊丟丰仙,举丿伉丳,临丅仟伊伉丂丳乙丆丿,仃丳丆举严乤丿伊伉,仟丂伉伊伈丳举严丿丰,丟丰仙伈丳丂伉举丿丅乽丆临両,仃伉丳丿,仃伈丳伉严乤両,丰伈丳严丿,丐,丐,丰仃丂伉丳丿丟,伈丳丂伉严乤両仟伊,仃伈丳丅举伉严乤丿仟丂伊,丟丰仃丁伈丳丿,仃丳丆举严乤丿丰,仙伈丳伉举丿临,仃伈丳伉严乤両,仟丂伉伊伈丳举严丰,仃丳丆举严乤丅丿仟丂伉,丰仃伈丳伉严乤両,丅举丿伊丳乙丆,丳丆举严乤丅丿,丐,丰仃丂伉丳丿,仃伈丳丂伉严乤両,举丅丿伊伉丳乙丆,丅乽丆両举严乴仙伈丳伉,丰仃伈丳伉严乤両丟,伊伉丳乙丆丿,丰仃伈丳丂伉严乤両临丟仟伊,举丿伉伊伈丳,伈丳両丆举丅丿丟,丰仃伈丳严乤両乽丆临,丰仃伈丳丂伉严乤両,丰丳丅亝临举丿仟伊伉丂,丐,仙伉伊伈丳丅丿,丰仃伈丳丂伉严乤両丟仟伊,丰仃丂伉丳丿丟,丰仃伈丳丂伉严乤両仟,丅举丿丟丰仃丁伈丳丂仟,丳举严乤丿,丰仃伈丳举伉严乤丿,临丟丰丁仙,伉伊伈丳举严丿,伉伊伈丳举严丿仃临,仃伈丳伉严乤両,伈丳両丆举丅丿仟伊丂伉,丐,丰仃伈丳丂伉严乤両丟,丰仃丂伉丳,伈丳严丿丅,丟丰丁仙丅临伊伉丳乙丆丿,仟丂伉伊丳乙丆丿,丅乽丆両举严乴丰伈丳仟丂伉,伊伉丳乙丆丿,仃丳丆举严乤丿伊伉,丰仃伈丳举伉严乤丿,丟丰仙伉伊伈丳丿,丰仃伈丳丂伉严乤両仟丟,丰仃伈丳伉严乤両举丿,丐,乽丆临両举严丟丰丂伈丳,丰仃伈丳丂伉严乤両,丟丰仙伉伊伈丳丅丿举,伈丳严丿仟丂伊伉,仟丂伉伊,丰伈丳丆严丅举丿,仃丳丆举严乤丅丿丟丰丁仙,丟丰仙丂伉伊伈丳丅丿仟,丟丰仙伈丳丂伉举丿丅乽丆両仟,伈丳伉严乤両,丰仃伈丳丂伉严乤両仟,临丟丰丁仙仟伊伉丂丳乙丆丿,丐,仃丳丆举严乤丅丿伈伊伉,仃伈丳伉严乤両丅乽丆临,仟丂伉伊,丐,伈丳严丿,丟丰仙伈丳伉举丿,仟丂伉伊丟仙,丰仃伈丳丂伉严乤両丟,仃丳丆举严乤丿仟丂伊伉,丅乽丆両举严乴伊伉伈丳乙,仃伈丳伉严乤両,伉伊伈丳举严丿,丐,丐,丰仃伈丳丂伉严乤両,丅举丿丟丰仙丂伉伊伈丳仟,伊伉丂丳乙丆丿,仃丂伉丳,仃伈丳丂伉严乤両,仟丂伊伉丳乙丆丿丰,伈丳严,仙丅临,丐,丰仃伈丳丂伉严乤両丅乽丆仟,丰仃伈丳伉严乤両,丐,临丟丁仙丅,丰仃伈丳丂伉严乤両丟,丰伈丳両丆举丿,仟丂伉伊丟丰仙丅乽丆临両举严,伈丳严丿伊伉,丅乽丆临両举严丂伉伊伈丳,仃丳丆举严乤丅丿丰伈,举丅丿仟丂伉伊丟丰仙,丰仃伈丳丂伉严乤両仟伊,举仟丂伉伊伈丳,伈丳丆严丅举丿,丅乽丆両举严乴丟丰仙丂伉伊伈,丐,丐,临仙丅,付丳丿,丟丰仙丂伉伊伈丳丅丿临,丟丰仃丁伈丳丿,仃伈丳丂伉严乤両,丅举丿,丟丁伈丳丂丿,仟丂伊伉丳举丆仃,丰伈丳严丿仟丂伉伊,丰仃伈丳丂伉严乤両丟,仃丳丿,丐,丟丰付丳丿,丰仃伈丳伉严乤両伊,丰仃伈丳伉严乤両,丟丰仙伉伊伈丳丿,伈丳严乤両临丟,仃伈丳伉严乤両,丐,仃丳丆举严乤丅丿丟丰丁仙,伉伊仙,仙伉伊伈丳丅丿,丰伈丳严仟丂伉伊,丅临仃丳丆举严乤,丰仃伈丳丂伉严乤両丟,丅举丿仟丂伊伉伈丳乙丆,丳丆举严乤丅丿仟丂伉,丅乽丆両举严乴仟伊伉丂丳乙,丰仃伈丳伉严乤両丟,仃伈丳伉严乤両,临仙丅伊伉丳乙丆丿,丐,仟丂伉伊丟丰仙,丰仃伈丳丂伉严乤両丟丅乽丆临,丰仃伈丳丂伉严乤両,伉伊伈丳举严丿丅,伈丳严丿,丟丰丁仙临,丰仃伈丳伉严乤両,举丿丟丰仙伉伊伈丳,临丟丁仙丅仟丂伊伉丳举丆丿,仃伈丳丅举伉严乤丿仟丂伊,丰伈丳両丆举丿仟丂伉伊,仃丳丆举严乤丅丿丟丰丁仙,丂伉伊仙,伊伉丳乙丆丿仙,仟丂伉伊伈丳举严丰仃,仃丳丆举严乤丅丿丟丰丁仙,丐,丅举丿仟丂伊伉伈丳乙丆,丳丆举严乤丅丿仟丂伉,丰仃伈丳丂伉严乤両丅丿仟,丟丰仙伉伊伈丳丿,伉丳丆严丿,临丅,仙伈丳伉举丿,丰伈丳両丆举丅丿丟仟丂伉伊,丟丰仃丁丂丳丿丅乽丆临両举严,丟丰付丳丅丿仃,丰仃伈丳伉严乤両,伈丳严丿,丐,丐,丟丰丁仙临,仃伈丳丂伉严乤両,丅乽丆両举严乴仙伉伊伈丳,丟丰仙伈丳伉举丿,伉伊,丰仃伈丳伉严乤両临丟,丟丰付丳丿,伈丳両丆举丅丿仟丂伊伉,丰仃伈丳丅举严乤丿,丰仃伈丳丂伉严乤両伊,丰仃丂伉丳丿仟伊,丂伉伊伈丳举严丿仃,丐,仃伈丳丅举严乤丿,丰仃伈丳丂伉严乤両丟,丰仃伈丳丂伉严乤両,乽丆両举严乴丟丰仙丂伉伊伈丳,伈丳丂伉严乤両,伊伉丳乙丆丿,临丟丰丁仙仟丂伉伊丳乙丆丿,丐,伈丳両丆举丅丿,仃伈丳伉严乤両丅乽丆临,丰仃伈丳丂伉严乤両仟,丰仃丂伉丳丿丅乽丆临両举严仟,丐,丅举丿仃丳丆丟丰丁仙,丟丂伈丳举丅丿,丟丰付丳,丰伈丳丆举丿,丅乽丆両举严乴丂伉伊伈丳,仃丳举严乤丿,伉伊仙,临丟丰丁仙丅仟丂伉伊丳乙丆丿,仃丳丆举严乤丅丿丰,丰仃丂伉丳丿临丟,丰仃伈丳丂伉严乤両丟,伈丳両丆举丅丿仟伊丂伉,丐,丟丰付丳丿,丰仃伈丳伉严乤両,仃丳丆举严乤丅丿伈,仙丅临,仟丂伉伊,丅乽丆両举严乴仟丂伉丳,丰仃伈丳丂伉严乤両仟,丟丰仙伈丳伉举丿,伉伊丟仙,丅丿伉伊丳乙丆,丰仃伈丳丂伉严乤両临丟,丟丰付丳丿,丐,伉伊伈丳举严丿丅乽丆临両,丰仃伈丳丂伉严乤両仟,伊伉丳乙丆丿,丰仃伈丳丂伉严乤両仟伊,丅举丿丂伉伊伈丳,丟丁伈丳丂丿,乽丆両举严乴丟丰仙丂伉伊伈丳,仟丂伉丳丆严丿,丅乽丆両举严乴仟丂伊伉伈丳乙,付丳丅丿,仃伈丳伉严乤両,临丟丰丁仙丅仟伊伉丂丳乙丆丿,丐,丰仃丂伉丳丿,丰仃伈丳丂伉严乤両丅举丿丟,举丅丿,丟丰仙丂伉伊伈丳丅丿,伈丳严丿,伉伊丟丰仙,伈丳严丿伊伉,付丳丅丿,仃丳丆举严乤丅丿伊伉,伉伊丟丰仙丅乽丆両举严乴,丰仃伈丳丂伉严乤両丟,举仟丂伉伊伈丳,丐,丰仃伉丳丿,丰仃伈丳丂伉严乤両丟,丅乽丆临両举严仟丂伉丳,伊伉丳乙丆丿,仟伊丂伉丳乙丆丿,丰仃丂伉丳丿,伊伉丳乙丆丿,丰仃伈丳丂伉严乤両仟,丅举丿丰丁丂伈丳丟,丐,丰仃伈丳丂伉严乤両乽丆,丰仃丂伉丳丿仟,丐,临仙丅伊伉丳乙丆丿,仃伈丳丂伉严乤両,丰伈丳両丆举丅丿丟,丅乽丆临両举严丰丳伊伉,丰伈丳両丆举丅丿仟丂伉,丂伉伊伈丳丅丿,丳丆举严乤丅丿,仃伈丳丅举伉严乤丿,丰丁丂伈丳丆严丿仟伊伉,丟丰丁仙丅临仃丳丆举严乤,仃伈丳严乤両,丅乽丆両举严乴仙伉伊伈丳,丐,仃丳丆举严乤丿丰,丰仃伈丳丂伉严乤両临丟,丰仃伈丳伉严乤両举丿,临丟丁仙丅丳丆举严乤,丿丟丰仃丁伈丳,伈丳両丆举丅丿,丅乽丆临両举严,仃伈丳丂丿,仙伈丳伉举丿,丟丰仙伊伈丳丅丿,丟丰丂伈丳举丅丿,丰仃伈丳丂伉严乤両,丐,伈丳伉严乤両,丰仃伈丳伉严乤両伊,丰仃伈丳丂伉严乤両,伉伊丳乙丆丿丰,伊伉丳举丆丿,仃丳丆举严乤丅丿丂伉伊伈,丰伈丳両丆举丅丿丟,仃丂举丳丅丿仟,丰仃伈丳丂伉严乤両仟,丅举丿丰丳,伈丳丂伉严乤両,丰仃伈丳丂伉严乤両丟,丐,仟丂伉伊伈丳举严丿丅乽丆両,仃伉丳丿,丅乽丆両举严乴仃伈丳伉,丐,仃丳丆举严乤丅丿丟丰仙丂伉伊,仃伈丳丂伉严乤両临,举丟丰仙丂伉伊伈丳仟,伈丳両丆举丅丿,丅乽丆临両举严丟丰仃丁伈丳丿,丰仃伈丳丂伉严乤両仟,丰仃伈丳伉严乤両,伈丳严丿,丐,丐,丟丰丁仙丅临,丰仃伈丳丂伉严乤両仟丟,仃丳丆举严乤丅丿仟丂伊伉伈,丟丁伈丳丿,伈丳丆举丿,丰丳亝临举丿,丰仃伉丳丿,伈丳両丆举丅丿仟丂伊伉,伉伊仙丅乽丆临両举严,丰仃伈丳丂伉严乤両伊,仃丳丆举严乤丅丿仟伊丂伉,丟丰仙丂伉伊伈丳丅丿,丐,丳丆举严乤丅丿伈,丰仃伈丳丂伉严乤両仟,丐,丅乽丆両举严乴伊伉丳,仃伈丳丂伉严乤両,伊伉丳乙丆丿,仃丂伉丳,丐,丰仃伈丳伉严乤両,丰仃伈丳丂伉严乤両丟丅乽丆临,伈丳丂伉严乤両仟,丅乽丆临両举严丰仃伈丳仟伊伉,丐,仟丂伊伉丳乙丆丿丟丰丁仙,仃伈丳严乤両,仃伈丳伉严乤両,仃丳丆举严乤丅丿丰,丅乽丆両举严乴仃伈丳,丰仃伈丳伉严乤両,丟丰仙伉伊伈丳丿,临丟丁仙丅,丰仃伉丳丿,临丟丰丁仙,丰仃伈丳伉严乤両丟,伈丳両丆举丅丿,丐,丰仃伈丳丂伉严乤両丟,丰仃伈丳严乤両,丰仃伈丳丂伉严乤両仟,丰仃伈丳丅举严乤丿丟,丐,丟丰仙伈丳丂伉举丿仃,伊伉丳乙丿,伉伊丟丰仙,伊伉丳乙丿仃伈,仙伉伊伈丳丅丿,丰仃伈丳伉严乤両,丰仃伈丳伉严乤両举丿,丐,伊伈丳举严,伈丳丂伉严乤両仟,丰仃丂举丳丅丿仟伊伉,丟丰仙伈丳丂伉举丿仟伊,丂伈丳丅丆严丿,仃伈丳丿,丅乽丆両举严乴伊伉伈丳乙,丟丰仙丂伉伊伈丳丅丿仟,丅乽丆両举严乴伊伉丳乙,丰仃伈丳丂伉严乤両,丰仃伈丳丂伉严乤両丅举丿仟,临丟丁仙丅仟伊伉丂丳乙丆丿,丐,丰伈丳両丆举丿仟丂伉伊,丰仃伈丳丂伉严乤両丟,仃丂伉丳丿,仃丳丆举严乤丅丿,伈丳严丿,丟丰丁仙丅临,丰伈丳严丿,丟丰仙丂伉伊伈丳丅丿,仟伊丂伉丳乙丆丿,丅乽丆両举严乴丰仃伈丳仟丂伊,丰仃伈丳伉严乤両,仃丳丆举严乤丿,丐,仙伉伊伈丳丅丿,丰仃伈丳丂伉严乤両仟举,仃丳丆举严乤丅丿丰仟丂伉,丰仃伈丳伉严乤両伊,仟伊丂伉丳乙丆丿丅举,伈丳丂伉严乤両,丅丿,丰仃丂伉丳丿,丅临,伊伉丳乙丆丿举丅,仃伈丳伉严乤両丅乽丆,丰仃丂伉丳丿仟,丐,丰仃伈丳丂伉严乤両临丟仟伊,丰仃伈丳丂伉严乤両丅举丿仟,伈丳両丆举丅丿丟,乽丆临両举严仟丂伊伉丳,丰伈丳両丆举丿仃仟丂伉,丅乽丆临両举严仃伈丳,丐,仙伉伊伈丳丅丿,丰伈丳严丿丟伊,丂伉伊伈丳丅丿,丰仃伈丳丂伉严乤両,丅举丿仟丂伉伊丳乙丆丟丰仃丁,丐,丰仃伈丳举伉严乤丿丟,丰仃伈丳丂伉严乤両临丟,丰仃伉丳丿,伉伊伈丳举严丿仃,仃伈丳丿,伈丳両丆举丅丿仟伊丂伉,丰仃丂伉丳丿丅乽丆临両举严,丰仃伈丳丂伉严乤両丟,丟丰仙丂伉伊伈丳仟,丅丿伈丳严,丰仃伈丳伉严乤両丟,仟丂伉伊丳乙丆丿,丐,仃伈丳伉严乤両,仃伈丳伉严乤両伊,丰仃伈丳伉严乤両,丰仃举丳丿,丟丰仙伈丳丂伉举丿仟临,仃丳丆举严乤丿,伈丳両丆举丅丿,乽丆临両举严丟丰丂伈丳,伉丳丆严丿,丰仃丂举丳丅丿仟伊伉,仃伈丳丂伉严乤両,仃伈丳伉严乤両,丐,仃丳丆举严乤丅丿,丰仃丂伉丳丿,丰仃伈丳丂伉严乤両丅举丿仟伊,伈丳举丿,伉伊伈丳举严丿丰仃,临仟伊伉丂丳乙丆丿,丰丳丅乽亝临举丿伊伉,伈丳両丆举丅丿仃,丅乽丆临両举严仃伈丳,仃伈丳丂伉严乤両,丰仃伈丳丂伉严乤両,丰仃伈丳丂伉严乤両仟,丐,丐,丟丰丁仙丅临,仃伈丳丂伉严乤両,丅乽丆両举严乴丰仃伈丳仟丂伊,仃伈丳丿举丅,仟丂伉伊伈丳举严丿,仃丳丆举严乤丅丿丰临丟,丰仃伈丳伉严乤両,丰仃伈丳丂伉严乤両仟,丟丰仙丂伉伊伈丳丅丿仟,伈丳丂伉严乤両仟伊,丰仃丂伉丳仟伊,丐,丐,丐,仃伈丳伉严乤両,丰仃伈丳丅举严乤丿,丅乽丆両举严乴仃丳仟丂伊伉,仃伈丳丂伉严乤両仟,伊伉丳乙丆丿,仟伊丂伉丳乙丆丿伈临丟,丟丰仙丂伉伊伈丳丅丿仃,丰伈丳両丆举丿,仟丂伉伊丟丰仙丅乽丆临両举严,伈丳両丆举丅丿伊伉,丅乽丆临両举严仙伉伊伈丳,丐,举丅丿丰仃伈丳仟丂伉,丰仃伈丳丂伉严乤両,丰丁伈丳丆严,丅丿丳丆举严乤,仃丂伉丳丿丅乽丆両举严乴,丟丰仙伈丳伉举丿,丐,临仙丅,丳丅亝临举丿,丟丰丂伈丳举丅乽丿临,丰仃伈丳伉严乤両丟,丰仃伈丳丂伉严乤両仟伊,丐,伈丳丂伉严乤両,丰仃伈丳丂伉严乤両,丰伈丳严丿仟丂伉伊,丟丰仙伈丳丂伉举丿,丂伉伊伈丳丅丿,仃丳丆举严乤丅丿,伊伉丳乙丆丿,伊伉丳乙丆丿,仃丳丆举严乤丿丰伈,丰仃伈丳丂伉严乤両丟,丐,仃伉丳丿丅乽丆両举严乴,丰仃伈丳伉严乤両丟,仃伉丳丿,丐,丅举丿伉伊丳乙丆,伈丳丂伉严乤両,丅乽丆临両举严丰仃伈丳仟丂伉,伊伉丂丳乙丆丿,仟丂伉伊伈丳举严丿,仟丂伉伊伈丳举严丿仃,丐,伈丳严丿,丟丰仙伈丳丂伉举丿仃,丰仃伈丳丂伉严乤両,丰仃伈丳丂伉严乤両丟乽丆,伉丳严丿伈,丐,临丟丰丁仙仟丂伉伊丳乙丆丿,丟丰伈丳举乽丿,伈丳両丆举丅丿,丅乽丆临両举严伊伉丳,丰伈丳両丆举丅丿,丅乽丆临両举严丂伉伊伈丳仟,丟丰仙伈丳丂伉举丿仟,仃丳丆举严乤丅丿仟丂伉,伈丳严丿仟伊伉丂,丰丁伈丳丆严伊,丰仃伈丳伉严乤両,丰仃丂伉丳丿丅乽丆両举严乴丟,丐,伉伊仙,丰仃伈丳丂伉严乤両临丟仟,丰仃伈丳伉严乤両,临丟丰丁仙丅,丟丰仙伈丳伉举丿,伈丳両丆举丅丿,仟丂伉伊伈丳举严丿丰仃丅乽丆,丟丰仃丁伈丳丿,丰丳丅乽亝临举丿伊伉,仃丳丆举严乤丅丿伈,仃伈丳伉严乤両,丂伉伊伈丳,丐,丰仃伈丳伉严乤両,丰仃伈丳伉严乤両举丿丟,伈丳伉严乤両丟,丿伉伊丳乙丆,仃丳丆举严乤丿临丟丰丁仙仟丂,丐,伈丳両丆举丅丿,丅乽丆临両举严伉伊伈丳,仃丳丆举严乤丅丿丰丂伉,仟伊伉丂丳乙丆丿,丰仃伈丳丂伉严乤両,丰仃伈丳丂伉严乤両丟丅举丿,丐,乽丆両举严乴丟丰仙丂伉伊伈丳,丳丆严丿,丰仃伈丳严乤両丅乽丆,仃伈丳丅举严乤丿,仃伈丳丅举严乤丿,临丅,仟伊丂伉丳乙丆丿仃,丰仃伈丳丂伉严乤両仟,丅举丿丟丰仃丁伈丳丂,伈丳丂伉严乤両,丰仃伈丳丂伉严乤両丟,丰丁丂伈丳丅丆严丿丟,丐,丐,仙伉伊伈丳丅丿,丰仃伈丳伉严乤両,仟丂伉伊丟丰仙丅乽丆両举严乴,丰仃伈丳伉严乤両丟,伈丳丆严举,临丟丁仙丅丳丆举严乤,丰仃伉丳丿,丟丰仙伈丳丂伉举丿仟,丅乽丆临両举严仃伈丳仟丂伉,伈丳举丅丿伊伉,丳丅亝临举丿伊伉,丰仃丂伉丳丿,丐,丰仃伈丳丂伉严乤両仟,丰仃伈丳丂伉严乤両丅举丿丟,伈丳丅举严乤丿,仃丳丆举严乤仟丂伊伉,仃丂伉丳丿,丟丰仙伈丳伉举丿伊,临仙丅伊伉丳乙丆丿,仃丳丆举严乤丿,丰伈丳両丆举丅丿丟,丰仃伈丳伉严乤両丅乽丆临,丰仃伈丳伉严乤両,丟丰仙伊伈丳丅丿,丐,仃伈丳丅举严乤丿,丰仃伈丳丂伉严乤両仟,丟丰丁仙丅临仃丳丆举严乤,伉伊仙,丅乽丆両举严乴丂伉伊伈丳,伉伊伈丳举严丿,仃丳丆举严乤丿丰丟,丰仃伈丳伉严乤両临丟,丅举丿,丳丆举严乤丅丿临丟丁仙,丰仃伈丳伉严乤両丟,丰伈丳両丆举丅丿丟仟伊丂伉,丐,仃伈丳丂伉严乤両,仃伈丳伉严乤両,丟丰仙丂伉伊伈丳丅丿,丟丰丁仙丅临,仃伈丳丂伉严乤両,丰仃丂伉丳丿丅举,伊伉丳乙丆丿,伊伉丳举丆丿,仃丳丆举严乤丿,丰丳丅亝临举丿,仃伈丳丂伉严乤両,仃伈丳伉严乤両,丐,丂伉伊伈丳丅丿,丰仃伈丳丂伉严乤両,伊伉丳乙丆丿,伈丳严丿伊伉,丅临,丟丰仃丁伈丳丂丿,丅乽丆両举严乴仟丂伉伊伈丳,伉伊伈丳举严丿仃,丅乽丆両举严乴伊伈丳乙,仃伈丳伉严乤両,丰仃伈丳伉严乤両丟,临丟丰丁仙丅,丐,伈丳両丆举丅丿,丰仃伈丳伉严乤両丅乽丆临丟,伉伊丳乙丆丿,仟丂伊伉丳举丆丿,伈丳严丿,仃丳丆举严乤丅丿伈",
  ji: "万伀,丐,串乽丈,仟丂,仟丅丆丂乧丰仃伀,乗丅丿仟丂,仓,仟丂,丟丰丁仙,丟丰丁乗仟丂,仟乧,仟丂伉,串乽丈,万伀,丰仃,丐,丅丱,仟丂,仟丅丆丂乧丟丰丁乗,仓,乗丅丿,仟丂丅,串乽丈仟丂,丐,丰仃,丟丰丁仙,仟乧丅丱,丐,仟丂丟丰丁乗,仟丂丟丰丁乗,丐,丐,仓,仟丂丅丱,丰仃伀,仟丂丅乗,仟丂丅丱,仟丂丅,丟丰丁乗仟丂,丟丰丁乗仟丂,仟丂,丐,丅丱,丐,丰仃,仓,仟丅丆丂乧,仟丂丅丱,仟丅丆丂乧丟丰丁乗,仟丂丅丱丟丰丁乗,仟丂,仟丂丟丰丁仙,串乽丈仟丂,乗丅丿,仟乧丰仃,丐,丅丱,丟丰丁仙,仓,丟丰丁乗仟丂,丐,仟丂,串乽丈,仟丂丅丱,丟丰丁仙,仟丂丅乗,丅丱,丐,丟丰丁乗仟丂,丟丰丁乗仟丂,仟丂伉,仓,仓,丐,丰仃,丟丰丁仙,仟丅丆丂乧,仟丂丅丱,丟丰丁乗仟丂,丟丰丁乗仟丂,乗丅丿,丐,串乽丈仟丂,仟丂伉,仟乧丰仃,仓,丅丱,丟丰丁仙,丟丰丁乗仟丂,丟丰丁乗仟丂,仟丅丆丂乧,万伀仟丂丅丱,串乽丈,仟丂丅,丰仃伀,仟丂伉乗丅丿,丅丱,丐,仓,丟丰丁乗仟丂,丐,丐,串乽丈,丐,仟丅丆丂乧丰仃伀,仟丂丅丱,仟丂伉丅丱,仟丂丅,丟丰丁乗仟丂,仟丂丅丟丰丁乗,丟丰丁仙,仓,串乽丈,乗丅丿,丰仃伀,仟丂,丟丰丁仙丅丱,仝伀,仟丂丟丰丁乗,仟丂丅丱丟丰丁乗,仟丅丆丂乧,仟丂丅丱,串乽丈,仟丂丅,仓,乗丅丿,仟乧丅丱,仟丂,丟丰丁仙,丟丰丁仙,万伀,丐,串乽丈,丐,丰仃仟丅丆丂乧,丐,丅丱,仓,丟丰丁乗仟丂,丟丰丁乗仟丂,丟丰丁仙乗丅丿,仟丂伉,串乽丈丟丰丁仙,仟丂,丰仃,丐,丟丰丁仙丅丱,仟丂,仟丂丟丰丁乗,仟丂丅丱丟丰丁乗,仓,丅丱仟丂,串乽丈,丐,仟乧丰仃伀,丟丰丁仙乗丅丿,丟丰丁仙丅丱,万伀,丟丰丁仙乗丅丿,仟丂丟丰丁乗,丅丱,丐,串乽丈仟丅丆丂乧,仓,丰仃仟丂伉,丐,仟丂丅丱,丐,丟丰丁乗仟丂,丟丰丁仙,仟乧,丐,串乽丈,乗丅丿,丰仃,丐,仓,丟丰丁仙仟丂丅丱,丟丰丁乗仟丂,仟丂丅丟丰丁乗,丐,仟丂丅,串乽丈丟丰丁仙,万伀,仟乧丰仃伀,乗丅丿,丅丱,丐,仟丂伉丟丰丁乗,仓,仟丅丆丂乧,仟丂,仟丅丆丂乧串乽丈,仟丂丅丱,丰仃仟丂伉,丟丰丁仙仟丂丅,仓,丐,丟丰丁乗仟丂,仟丂丟丰丁乗,乗丅丿,丟丰丁仙,串乽丈,丐,丰仃,丐,仟丅丆丂乧,丟丰丁仙仟丂丅丱,丟丰丁乗仟丂,仓,丐,丐,串乽丈仟乧,仟丂,伀丰仃丟,仝伀乗丅丿,串乽丈仟丅丆丂乧,仟丂丅丱,丰仃,丟丰丁仙,仝伀丅丱,丐,仟乧丟丰丁乗,丟丰丁乗仟丂,乗丅丿,丐,仓,丐,丰仃,丐,丅丱仟丂,仟丂丅丱丟丰丁仙,丟丰丁仙,丟丰丁乗仟丂,丐,丐,串乽丈,仟丂,丰仃伀,仓,仓,丅丱,丟丰丁仙乗丅丿,丟丰丁乗仟丂,仟丅丆丂乧,丟丰丁仙仟丂丅丱,串乽丈仟丂,仟丂丅,丰仃,仟丂伉,仟乧丅丱,丐,仟乧丟丰丁乗,仓,丟丰丁仙,丐,串乽丈,乗丅丿,丰仃丟,仟丂,丅丱,仟丂伉,丟丰丁乗仟丂,丟丰丁乗仟丂,丐,丐,仓,丐,丰仃,乗丅丿,仟丂丅丱,丟丰丁仙,丟丰丁仙仟丅丆丂乧,仟丂丅丱丟丰丁乗,丐,丐,串乽丈,丐,丰仃,仓,丅丱,仟丂,仟丂伉丟丰丁乗,仟丂伉丟丰丁乗,丟丰丁仙乗丅丿,仝伀,串乽丈,仟丂丅丱,仟丅丆丂乧丰仃,仟丂,丅丱,仟丂丅,仓,丟丰丁乗仟丂,丐,仟丂,串乽丈,丟丰丁仙,万伀丰仃,乗丅丿,丅丱,丐,丟丰丁仙,仟丂丅丱丟丰丁乗,丐,仓,丅丱,丐,仟乧丰仃伀,丐,丟丰丁仙丅丱,仟丂,丟丰丁乗仟丂,丟丰丁乗仟丂,仟丂,仟丂,串乽丈,乗丅丿,仓,仟丂丅,丅丱,丟丰丁仙,丟丰丁乗仟丂,丟丰丁仙,丐,万伀仟丂,串乽丈,丐,丰仃,乗丅丿,丅丱,仓,丟丰丁乗仟丂,丟丰丁仙,仟丂,仟丂,串乽丈,丟丰丁仙,仟乧丰仃伀,丟丰丁仙,丅丱,丐,仟丂伉丟丰丁乗,丟丰丁乗仟丂,仓,仟丂丅丱,串乽丈,仟丂丅,丰仃仟丂,仟丂丅,丟丰丁仙串乽丈,丟丰丁仙,仟乧丟丰丁乗,丟丰丁乗仟丂,仟丂伉,丐,串乽丈,仓,仟丅丆丂乧丰仃伀,仟丂丅丱乗,丅丱仟,仟丂丅丱,丟丰丁乗仟丂,丟丰丁仙,仝伀,丟丰丁仙,串乽丈,丐,丰仃,丐,仓,丐,丟丰丁乗仟丂,丟丰丁乗仟丂,丟丰丁仙仟丂,丐,串乽丈丟丰丁仙,乗丅丿,丰仃伀,仟丂,丅丱,仟丂,丟丰丁乗仟丂,仓,仓,丐,串乽丈,丐,仟丅丆丂乧丰仃伀,仟丂丅丱丟丰丁仙乗,仟丂丅丱,仟丂丅,丟丰丁仙,丟丰丁乗仟丂,仟乧,丐,串乽丈仟乧,仓,丰仃,丐,丅丱,仟丂,丟丰丁仙,万伀仟丂丅丱丟丰丁乗,丟丰丁仙乗丅丿,仟丂丅,串乽丈仟丂,丐,丰仃,丐,仓,丐,仟丂伉丟丰丁乗,丟丰丁乗仟丂,丐,丟丰丁仙,万伀串乽丈仟丅丆丂乧,仟丂丅丱,丰仃伀,仟丂丅乗,丅丱,仟丂丅,丟丰丁乗仟丂,仓,仟乧,仟丂伉,串乽丈,丐,丰仃伀丟,仝伀,仟丅丆丂乧,仟丂丅丱,仟丅丆丂乧丟丰丁乗,仟丂丟丰丁乗,仟丂,仟丂丅,仓,仟丂伉乗丅丿,丰仃,丐,丅丱,丟丰丁仙,万伀丟丰丁乗仟丂,丟丰丁乗仟丂,丐,仟丂,串乽丈,丐,丰仃伀,仓,丅丱,丐,仟乧丟丰丁乗,丟丰丁仙,丟丰丁仙,仟丂仝伀,万伀串乽丈仟丂,丐,丰仃,丐,仟丅丆丂乧,仟丂丅丱,仓,仟丂丟丰丁乗,乗丅丿,丐,串乽丈仟丂,丟丰丁仙,丰仃,万伀,丅丱,丟丰丁仙,丟丰丁乗仟丂,丟丰丁乗仟丂,丐,仓,串乽丈,丐,丰仃伀,乗丅丿,丅丱,丟丰丁仙,丟丰丁乗仟丂,丟丰丁乗仟丂,仟丂伉,丟丰丁仙,串乽丈,丐,仓,仟丂丅丱,丅丱,仟丂丅,仟丂丟丰丁乗,仟丂丅丟丰丁乗,丟丰丁仙,丐,串乽丈仟乧,乗丅丿,丰仃伀,仟丂,丅丱,仓,仟丅丆丂乧丟丰丁乗,丟丰丁乗仟丂,仟丅丆丂乧,仟丂丅丱,串乽丈,丟丰丁仙仟丂丅,仟丂丰仃伀,乗丅丿,仟丂丅丱,丐,丟丰丁仙,丟丰丁乗仟丂,仓,丐,串乽丈,丐,仟丅丆丂乧丰仃伀,仟丂丅丱,丟丰丁仙丅丱,仟丂万伀,丟丰丁乗仟丂,丟丰丁乗仟丂,丟丰丁仙乗丅丿,丐,串乽丈,仓,仓,丐,丟丰丁仙丅丱,丐,仟丂丟丰丁乗,丟丰丁仙,仝伀,仟丂丅,串乽丈,丐,丰仃伀,乗丅丿,仟乧丅丱,仓,丟丰丁乗仟丂,丟丰丁乗仟丂,仟丂,丐,串乽丈丟丰丁仙,仟丂丅丱,丰仃,丐,仟丂丅丱,丐,丟丰丁乗仟丂,丟丰丁乗仟丂,仓,丐,串乽丈,仟丂乗丅丿,丰仃,丟丰丁仙,仟丅丆丂乧,丟丰丁仙仟丂丅丱,丟丰丁乗仟丂,仟丂丟丰丁乗,丐,仟丂,丅丱,仓,仟乧丰仃伀,乗丅丿,丅丱,丐,丟丰丁仙,丟丰丁仙,仟丂,仟丂,万伀丅丱,丐,丟丰丁乗仟丂,丟丰丁乗仟丂,仟丅丆丂乧,丟丰丁仙仟丂丅丱,仓,仟丂,丰仃,丐,丅丱仟乧,丟丰丁仙,丟丰丁仙,丟丰丁乗仟丂,丟丰丁仙,丐,串乽丈,乗丅丿,仟丅丆丂乧丰仃,仓,丅丱,仟丂丅,仟丂丟丰丁乗,丟丰丁乗仟丂,仟丂伉,丟丰丁仙,串乽丈,丐,丰仃伀,仟丂乗丅丿,仟丂丅丱,丐,仓,仟丂丅丱丟丰丁乗,丐,仟丂丅,串乽丈仟丂,仟丂丅,丟丰丁仙伀,丐,仟丂丅丱,仟丂,丟丰丁乗仟丂,丟丰丁乗仟丂,丟丰丁仙乗丅丿,仓,串乽丈仟丅丆丂乧,仟丂丅丱,仟丅丆丂乧丰仃,仟丂丅丱,丅丱,丟丰丁仙仟丂,仝伀仟丂丟丰丁乗,丟丰丁乗仟丂,仟乧,丅丱,串乽丈,丐,仓,乗丅丿,仟丂伉丅丱,仟丂伉,丟丰丁乗仟丂,仟丂丟丰丁乗,仟丂丟丰丁仙,万伀丟丰丁仙,串乽丈,丐,仟乧丰仃伀,丐,丐,仓,仓,仟丂丟丰丁乗,仟丂,丐,串乽丈仟丅丆丂乧,丟丰丁仙乗丅丿,丰仃仝伀,仟丂丅,丅丱,丟丰丁仙,丟丰丁乗仟丂,丟丰丁乗仟丂,仟乧,仓,串乽丈,丐,丰仃,乗丅丿,丟丰丁仙丅丱,万伀仟丂丅丱,丟丰丁乗仟丂,仟丂丅丟丰丁仙,仟丂,仟丂,串乽丈仟丂,仟丂伉,仓,丟丰丁仙,丅丱,仟丂,丟丰丁乗仟丂,丟丰丁仙,仟丅丆丂乧乗,仟丂丅丱,串乽丈仟丂,仟丂,丰仃仟丂伉,仟丂丅,丐,仓,仟乧丟丰丁乗,丟丰丁乗仟丂,丐,丐,串乽丈丟丰丁仙,仝伀,仟丂丰仃,仟丂丅丱乗,仟丂伉丅丱,仟丂伉,丟丰丁仙,仟丂丅丟丰丁乗,仓,丟丰丁仙,串乽丈仟乧,仟丂,丰仃仟丂,丟丰丁仙,万伀,丐,丟丰丁乗仟丂,仟丂伉丟丰丁乗,仟丅丆丂乧丟丰丁仙,仟丂丅丱,串乽丈,仓,丰仃伀,仟丂,仟丂丅丱,丐,丟丰丁仙,仝伀丟丰丁乗仟丂",
};
let TD_CACHE = null;
function tdInit() {
  if (TD_CACHE) return;
  const it = TIME_DATA.items.split(" ");
  const dec = (s) => [...s].map((c) => it[c.charCodeAt(0) - 0x4e00]).filter((x) => x && x !== "无");
  TD_CACHE = { yi: TIME_DATA.yi.split(",").map(dec), ji: TIME_DATA.ji.split(",").map(dec) };
}
/* 时辰天神(黄黑道):日支定“青龙”所起的时支 */
const HR_TS_START = { 0: 8, 6: 8, 1: 10, 7: 10, 2: 0, 8: 0, 3: 2, 9: 2, 4: 4, 10: 4, 5: 6, 11: 6 };
function hoursOfDay(y, m, d) {
  tdInit();
  const jd = jdFromGreg(y, m, d, 12),
    dn = Math.floor(jd + 0.5 + 1e-9),
    dayIdx = (((dn + 49) % 60) + 60) % 60,
    dz = dayIdx % 12,
    dg = dayIdx % 10;
  const out = [];
  for (let h = 0; h < 12; h++) {
    const ts = TIANSHEN[(((h - HR_TS_START[dz]) % 12) + 12) % 12],
      huang = TS_HUANG.includes(ts);
    const stem = ((dg % 5) * 2 + h) % 10,
      key = dayIdx * 12 + h;
    out.push({
      b: h,
      gz: GAN[stem] + ZHI[h],
      ts,
      huang,
      chong: ZODIAC[(h + 6) % 12],
      chongZ: (h + 6) % 12,
      yi: TD_CACHE.yi[key],
      ji: TD_CACHE.ji[key],
      span: [
        "23–01",
        "01–03",
        "03–05",
        "05–07",
        "07–09",
        "09–11",
        "11–13",
        "13–15",
        "15–17",
        "17–19",
        "19–21",
        "21–23",
      ][h],
    });
  }
  return out;
}
/* ---------------- 八宅命卦 ---------------- */
const BZH_TRI = ["", "坎", "坤", "震", "巽", "", "乾", "兑", "艮", "离"];
const BZH_DIR = {
  坎: "北",
  坤: "西南",
  震: "东",
  巽: "东南",
  乾: "西北",
  兑: "西",
  艮: "东北",
  离: "南",
};
const BZH_TAB = {
  // 每卦的:生气 天医 延年 绝命 五鬼 祸害 六煞(伏位为本卦)
  坎: ["巽", "震", "离", "坤", "艮", "兑", "乾"],
  离: ["震", "巽", "坎", "乾", "兑", "艮", "坤"],
  震: ["离", "坎", "巽", "兑", "坤", "乾", "艮"],
  巽: ["坎", "离", "震", "艮", "乾", "坤", "兑"],
  乾: ["兑", "艮", "坤", "离", "巽", "震", "坎"],
  坤: ["艮", "兑", "乾", "坎", "震", "巽", "离"],
  兑: ["乾", "坤", "艮", "震", "离", "坎", "巽"],
  艮: ["坤", "乾", "兑", "巽", "坎", "离", "震"],
};
const BZH_NAMES = ["生气", "天医", "延年", "绝命", "五鬼", "祸害", "六煞"];
const BZH_TXT = {
  伏位: ["吉", "本命方位,稳定安适,宜作静修、睡眠之所"],
  生气: ["大吉", "贪狼木星,旺气与生发,利事业、活力与人缘,宜大门、主卧床头、办公桌朝向"],
  天医: ["大吉", "巨门土星,利健康与贵人,宜卧室、康养、病人休养"],
  延年: ["大吉", "武曲金星,利人际、婚姻与长久关系,宜夫妻卧室与合作场所"],
  绝命: ["大凶", "破军金星,耗损与生机受阻,宜作储物、卫浴等少停留处"],
  五鬼: ["凶", "廉贞火星,是非口舌与意外,宜避免作卧室、书桌方位"],
  祸害: ["小凶", "禄存土星,口舌与小病,宜少久坐久睡"],
  六煞: ["小凶", "文曲水星,感情纠葛与桃花是非,宜谨慎使用"],
};
function mingGuaOf(yearNum, gender) {
  // yearNum:立春为界的农历(命)年
  let yy = yearNum % 100,
    g;
  if (gender === "M") {
    g = yearNum < 2000 ? (100 - yy) % 9 : (99 - yy) % 9;
    if (g === 0) g = 9;
    if (g === 5) g = 2;
  } else {
    g = yearNum < 2000 ? (((yy - 4) % 9) + 9) % 9 : (yy + 6) % 9;
    if (g === 0) g = 9;
    if (g === 5) g = 8;
  }
  const name = BZH_TRI[g];
  return {
    num: g,
    name,
    east: ["坎", "离", "震", "巽"].includes(name),
    tab: [name].concat(BZH_TAB[name]),
  };
}
function bazhaiOf(R) {
  const yn = R.bz.yearNum,
    mg = mingGuaOf(yn, R.opt.gender);
  const dirs = [{ n: "伏位", g: mg.name }].concat(
    BZH_NAMES.map((n, i) => ({ n, g: BZH_TAB[mg.name][i] })),
  );
  dirs.forEach((x) => {
    x.dir = BZH_DIR[x.g];
    x.t = BZH_TXT[x.n][0];
    x.d = BZH_TXT[x.n][1];
  });
  return { mg, dirs, yn };
}
/* ---------------- 紫微:小限 与 飞宫四化 ---------------- */
function ziweiXiaoxian(zw, lunar, gender, age) {
  // 小限:寅午戌起辰、申子辰起戌、巳酉丑起未、亥卯未起丑;男顺女逆
  const yb = mod(lunar.year - 4, 12),
    start = [4, 10, 7, 1][
      [
        [2, 6, 10],
        [8, 0, 4],
        [5, 9, 1],
        [11, 3, 7],
      ].findIndex((g) => g.includes(yb))
    ];
  const fwd = gender === "M";
  return mod(fwd ? start + (age - 1) : start - (age - 1), 12);
}
function ziweiFly(zw) {
  // 各宫天干飞四化落宫
  const rows = [];
  zw.pal.forEach((p) => {
    const hs = SIHUA[p.stem],
      lab = ["禄", "权", "科", "忌"];
    const fl = hs.map((nm, i) => {
      let at = null;
      zw.pal.forEach((q) =>
        q.stars.forEach((s) => {
          if (s.n === nm) at = q;
        }),
      );
      return { h: lab[i], star: nm, to: at ? at.name : "-", self: at && at.b === p.b };
    });
    rows.push({ from: p.name, b: p.b, stem: GAN[p.stem], fl });
  });
  return rows;
}
function ziweiExtra(zw, lunar, gender, nowYear) {
  const sec = [],
    age = nowYear - lunar.year + 1;
  const P = RD_PAL;
  // 小限
  if (age >= 1 && age <= 100) {
    const xb = ziweiXiaoxian(zw, lunar, gender, age),
      xp = zw.pal[xb];
    const nxt = zw.pal[ziweiXiaoxian(zw, lunar, gender, age + 1)];
    sec.push({
      title: `小限(虚岁 ${age})`,
      items: [
        {
          k: `小限落${xp.name}(${ZHI[xb]})`,
          t: `今年小限行至本命${xp.name}:${P[xp.name].th}是这一年的注意力所在。宫内主星${
            zwMain(xp)
              .map((s) => s.n + (s.br ? "(" + RD_BR[s.br] + ")" : ""))
              .join("、") || "无(借对宫)"
          };本宫倾向:${zwLevel(zwPalScore(zw, xp))[0]}。明年小限将入${nxt.name}。\n小限与大限、流年叠加看:三者同指一宫的领域,当年该领域最受牵动。`,
          tone: zwLevel(zwPalScore(zw, xp))[1],
          basis: "小限(男顺女逆,以年支三合定起宫)",
        },
      ],
    });
  }
  // 飞宫
  const fly = ziweiFly(zw),
    key = ["命宫", "财帛", "官禄", "夫妻", "迁移", "福德"];
  const items = fly
    .filter((r) => key.includes(r.from))
    .map((r) => ({
      k: `${r.from}(${r.stem}干)飞化`,
      t:
        r.fl.map((f) => `化${f.h}:${f.star}入${f.to}${f.self ? "(自化)" : ""}`).join(";") +
        "。\n" +
        r.fl
          .filter((f) => f.h === "禄" || f.h === "忌")
          .map((f) =>
            f.h === "禄"
              ? `${r.from}之事为${f.to}带来机会与资源(${P[r.from].noun}→${P[f.to] ? P[f.to].noun : ""})`
              : `${r.from}之事牵挂并压在${f.to}上,${P[f.to] ? P[f.to].noun : ""}是这里的功课`,
          )
          .join("\n") +
        (r.fl.some((f) => f.self)
          ? "\n有自化:该宫所主之事内在起伏、自我消耗或主动放手的倾向。"
          : ""),
      tone: "mid",
      basis: "宫干四化",
    }));
  sec.push({
    title: "宫位飞化(飞星四化)",
    items,
    note: "飞星派以“各宫天干飞化入他宫”论宫与宫之间的关系。这里只列命、财、官、夫、迁、福六宫的飞化,完整十二宫表见下方折叠项。",
    collapse: false,
  });
  sec.push({
    title: "十二宫飞化总表",
    items: fly.map((r) => ({
      k: `${r.from}(${GAN[zw.pal.find((p) => p.name === r.from).stem]}${ZHI[r.b]})`,
      t: r.fl.map((f) => `化${f.h}→${f.to}${f.self ? "·自化" : ""}`).join("  "),
      basis: "宫干四化",
    })),
    collapse: true,
  });
  return sec;
}
/* ---------------- 六爻补充 ---------------- */
function liuyaoExtra(L, R) {
  const rows = L.rows,
    items = [];
  const isC = (a, b) => Z_CHONG.some(([x, y]) => (x === a && y === b) || (x === b && y === a)),
    isH = (a, b) => Z_HE6.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  const pairs = [
    [0, 3],
    [1, 4],
    [2, 5],
  ];
  const c6 = pairs.every(([a, b]) => isC(rows[a].b, rows[b].b)),
    h6 = pairs.every(([a, b]) => isH(rows[a].b, rows[b].b));
  if (c6)
    items.push({
      k: "六冲卦",
      t: "内外卦六爻两两相冲:主变动、分离、事难久持,近事易成而不长,远事多有反复;传统上“六冲卦”利散不利聚(求婚合作忌,解散、出行、破旧立新反宜)。",
      tone: "bad",
      basis: "装卦",
    });
  if (h6)
    items.push({
      k: "六合卦",
      t: "内外卦六爻两两相合:主聚合、和谐、事易成而稳,但也主“牵绊”,病讼之事易缠绵拖延。",
      tone: "good",
      basis: "装卦",
    });
  if (L.pal.order === "游魂")
    items.push({
      k: "游魂卦",
      t: "八宫游魂:主动荡不定、心神不安、多迁移变动;占事宜稳,占行人多在外未归。",
      tone: "mid",
      basis: "八宫",
    });
  if (L.pal.order === "归魂")
    items.push({
      k: "归魂卦",
      t: "八宫归魂:主事有归宿、回归原处、渐趋安定;占事多为“回到原点”之象。",
      tone: "mid",
      basis: "八宫",
    });
  // 卦身
  const shi = L.shi,
    shiYang = rows[shi - 1].yang;
  const start = shiYang ? 0 : 6; // 阳世起子月,阴世起午月,顺数至世爻数
  const gb = mod(start + shi - 1, 12);
  const hit = rows.filter((r) => r.b === gb);
  items.push({
    k: `卦身 ${ZHI[gb]}`,
    t: `世爻第${shi}爻为${shiYang ? "阳" : "阴"},${shiYang ? "从子" : "从午"}起数至第${shi}位得卦身${ZHI[gb]}。${hit.length ? `卦身现于第${hit.map((r) => r.i + 1).join("、")}爻(${hit.map((r) => r.rel).join("、")}):此爻所主之事为全卦的“身”,宜与用神对看。` : "卦身不上卦:传统称“卦身不现”,事缺根基,宜待其出现(逢卦身之月日)。"}`,
    tone: hit.length ? "mid" : "bad",
    basis: "卦身",
  });
  // 进退神 全卦
  const mv = rows.filter((r) => r.moving && (r.change === "化进神" || r.change === "化退神"));
  if (mv.length)
    items.push({
      k: "进退神",
      t:
        mv.map((r) => `第${r.i + 1}爻${r.change}`).join(";") +
        "。化进神主事渐进、趋势向前;化退神主事渐退、力量收缩。",
      tone: mv.some((r) => r.change === "化进神") ? "good" : "bad",
      basis: "动变",
    });
  // 反吟伏吟(以卦):动爻变后与本爻同支或相冲
  const fyin = rows.filter((r) => r.moving && r.change && r.change.startsWith("化冲")),
    f2 = rows.filter((r) => r.moving && r.change && r.change.startsWith("伏吟"));
  if (fyin.length)
    items.push({
      k: "反吟",
      t: `第${fyin.map((r) => r.i + 1).join("、")}爻动而化冲(反吟):事有反复、去而复来,易反悔、变卦。`,
      tone: "bad",
      basis: "动变",
    });
  if (f2.length)
    items.push({
      k: "伏吟",
      t: `第${f2.map((r) => r.i + 1).join("、")}爻动而不变(伏吟):事情呻吟拖延、原地不动。`,
      tone: "bad",
      basis: "动变",
    });
  return items.length
    ? { title: "卦象补充(六冲六合、卦身、游归魂)", items, collapse: false }
    : null;
}
/* ---------------- 八字从格提示 ---------------- */
function congGeNote(bz, D) {
  const st = D.st,
    tg = bzTenGods(bz),
    dw = GAN_WX[bz.dm];
  const branchRoot = bz.pill.some((p) =>
    CANG[p.b].some((g, k) => k === 0 && (GAN_WX[g] === dw || GAN_WX[g] === (dw + 4) % 5)),
  );
  const g = {
    比劫: bzG(tg, ["比肩", "劫财"]),
    食伤: bzG(tg, ["食神", "伤官"]),
    财: bzG(tg, ["正财", "偏财"]),
    官杀: bzG(tg, ["正官", "七杀"]),
    印: bzG(tg, ["正印", "偏印"]),
  };
  const help = g.比劫 + g.印,
    drain = g.食伤 + g.财 + g.官杀;
  if (st.ratio < 0.2 && !branchRoot && drain > 0) {
    const top = ["食伤", "财", "官杀"].sort((a, b) => g[b] - g[a])[0];
    return {
      k: "从格提示(疑似)",
      t: `日主极弱且四支本气都不见同类与印星(无根),而${top}(${g[top].toFixed(1)})势力压倒:符合“从${top === "食伤" ? "儿" : top === "财" ? "财" : "杀"}格”的一般条件。若确为从格,取用与上文的“扶身”相反——应顺其势(取${top}及其所生之五行),忌印比帮身。此判断对时辰、藏干、合冲极敏感,务必由专业人士结合全局复核。`,
      tone: "mid",
      basis: "日主无根 + 一方独旺",
    };
  }
  if (st.ratio > 0.86 && drain < 1.2)
    return {
      k: "专旺提示(疑似)",
      t: `同类与印星力量占绝对优势(约 ${(st.ratio * 100).toFixed(0)}%),食财官几乎无力:接近“专旺/从强”一类结构,一般宜顺其旺势(取比印与其所生之食伤),忌以官杀强克。此类格局条件苛刻,请以专业复核为准。`,
      tone: "mid",
      basis: "一方极旺",
    };
  return null;
}

function bazhaiSection(R) {
  const B = bazhaiOf(R),
    mg = B.mg;
  const items = [
    {
      k: `命卦 ${mg.name}(${mg.num}) · ${mg.east ? "东四命" : "西四命"}`,
      t: `按${B.yn}年(立春为界)出生、${R.opt.gender === "M" ? "男" : "女"}命推得。${mg.east ? "东四命(坎离震巽)" : "西四命(乾坤艮兑)"}宜住同组的宅与方位:${mg.east ? "北、东、东南、南" : "西、西北、西南、东北"}为同组四方,其余四方为异组。\n八宅是“人与宅方位”的匹配理论,与玄空(看宅本身的运)是两套体系,可互相参考。`,
      tone: "good",
      basis: "命卦公式",
    },
  ];
  B.dirs.forEach((x) => {
    items.push({
      k: `${x.n} · ${x.dir}(${x.g}方)`,
      t: x.d,
      tone: x.t.includes("吉") ? "good" : x.t.includes("凶") ? "bad" : "mid",
      badge: x.t,
      basis: "八宅",
    });
  });
  const best = B.dirs
      .filter((x) => ["生气", "天医", "延年"].includes(x.n))
      .map((x) => x.dir + "(" + x.n + ")")
      .join("、"),
    worst = B.dirs
      .filter((x) => ["绝命", "五鬼"].includes(x.n))
      .map((x) => x.dir + "(" + x.n + ")")
      .join("、");
  items.push({
    k: "实用摘要",
    t: `卧室床头、书桌朝向、办公位可优先考虑:${best};尽量避免长期朝向或久坐久睡于:${worst}。这只是环境选择的辅助参考,居家安排仍应以采光、通风、安静与舒适为先。`,
    tone: "mid",
    basis: "八宅",
  });
  return {
    title: "八宅命卦与吉凶方位",
    items,
    collapse: true,
    note: "八宅遵《八宅明镜》通行口径,伏位为本卦;吉方为生气、天医、延年,凶方为绝命、五鬼、祸害、六煞。",
  };
}

/* =====================================================================
   此刻(实时)核心:七十二候 · 太阳与月亮的高度方位/出没 · 月相与朔望 · 三伏数九 · 时辰刻更 · 节气倒计时
   精度:太阳位置沿用本页已校准的视黄经;月球用 Meeus 主要周期项(黄经、黄纬),出没时刻为分钟级示意。
   ===================================================================== */
const NW_HOU = [
  ["立春", ["东风解冻", "蛰虫始振", "鱼陟负冰"]],
  ["雨水", ["獭祭鱼", "鸿雁来", "草木萌动"]],
  ["惊蛰", ["桃始华", "仓庚鸣", "鹰化为鸠"]],
  ["春分", ["玄鸟至", "雷乃发声", "始电"]],
  ["清明", ["桐始华", "田鼠化为鴽", "虹始见"]],
  ["谷雨", ["萍始生", "鸣鸠拂其羽", "戴胜降于桑"]],
  ["立夏", ["蝼蝈鸣", "蚯蚓出", "王瓜生"]],
  ["小满", ["苦菜秀", "靡草死", "麦秋至"]],
  ["芒种", ["螳螂生", "鵙始鸣", "反舌无声"]],
  ["夏至", ["鹿角解", "蜩始鸣", "半夏生"]],
  ["小暑", ["温风至", "蟋蟀居壁", "鹰始鸷"]],
  ["大暑", ["腐草为萤", "土润溽暑", "大雨时行"]],
  ["立秋", ["凉风至", "白露降", "寒蝉鸣"]],
  ["处暑", ["鹰乃祭鸟", "天地始肃", "禾乃登"]],
  ["白露", ["鸿雁来", "玄鸟归", "群鸟养羞"]],
  ["秋分", ["雷始收声", "蛰虫坯户", "水始涸"]],
  ["寒露", ["鸿雁来宾", "雀入大水为蛤", "菊有黄华"]],
  ["霜降", ["豺乃祭兽", "草木黄落", "蛰虫咸俯"]],
  ["立冬", ["水始冰", "地始冻", "雉入大水为蜃"]],
  ["小雪", ["虹藏不见", "天气上升地气下降", "闭塞而成冬"]],
  ["大雪", ["鹖旦不鸣", "虎始交", "荔挺出"]],
  ["冬至", ["蚯蚓结", "麋角解", "水泉动"]],
  ["小寒", ["雁北乡", "鹊始巢", "雉始雊"]],
  ["大寒", ["鸡始乳", "征鸟厉疾", "水泽腹坚"]],
];
const NW_HOU_ORD = ["初候", "二候", "三候"];
const NW_HOU_MEAN = {
  东风解冻: "东风送暖,冰雪始融",
  蛰虫始振: "冬眠的虫开始苏醒",
  鱼陟负冰: "河冰融解,鱼游近冰面",
  獭祭鱼: "水獭捕鱼陈列如祭",
  鸿雁来: "大雁北返(春)/南来(秋)",
  草木萌动: "草木萌芽",
  桃始华: "桃花始开",
  仓庚鸣: "黄鹂鸣叫",
  鹰化为鸠: "古人以为鹰变为鸠",
  玄鸟至: "燕子飞来",
  雷乃发声: "春雷始鸣",
  始电: "开始有闪电",
  桐始华: "桐花始开",
  田鼠化为鴽: "田鼠藏而鹌鹑出",
  虹始见: "雨后始见彩虹",
  萍始生: "浮萍开始生长",
  鸣鸠拂其羽: "布谷鸟飞鸣",
  戴胜降于桑: "戴胜鸟落桑树",
  蝼蝈鸣: "蝼蛄始鸣",
  蚯蚓出: "蚯蚓出土",
  王瓜生: "王瓜蔓生",
  苦菜秀: "苦菜长成",
  靡草死: "喜阴细草枯死",
  麦秋至: "麦子成熟",
  螳螂生: "螳螂孵出",
  鵙始鸣: "伯劳始鸣",
  反舌无声: "反舌鸟停鸣",
  鹿角解: "鹿角脱落",
  蜩始鸣: "蝉始鸣",
  半夏生: "半夏草生",
  温风至: "热风吹来",
  蟋蟀居壁: "蟋蟀避热入壁",
  鹰始鸷: "鹰始练搏击",
  腐草为萤: "腐草化为萤(古说)",
  土润溽暑: "土湿闷热",
  大雨时行: "雷雨时至",
  凉风至: "凉风吹来",
  白露降: "早晚露水凝",
  寒蝉鸣: "寒蝉鸣叫",
  鹰乃祭鸟: "鹰捕鸟陈列如祭",
  天地始肃: "天地始有肃杀之气",
  禾乃登: "谷物成熟",
  玄鸟归: "燕子南归",
  群鸟养羞: "群鸟储食过冬",
  雷始收声: "雷声渐息",
  蛰虫坯户: "虫封洞穴过冬",
  水始涸: "水量渐少",
  鸿雁来宾: "大雁南飞",
  雀入大水为蛤: "雀少而蛤多(古说)",
  菊有黄华: "菊花盛开",
  豺乃祭兽: "豺捕兽陈列如祭",
  草木黄落: "草木枯黄",
  蛰虫咸俯: "蛰虫俯首入穴",
  水始冰: "水面始结冰",
  地始冻: "土地始封冻",
  雉入大水为蜃: "雉少而蜃多(古说)",
  虹藏不见: "不再见彩虹",
  天气上升地气下降: "阴阳二气隔绝",
  闭塞而成冬: "天地闭塞成冬",
  鹖旦不鸣: "鹖旦鸟不再鸣",
  虎始交: "虎开始求偶",
  荔挺出: "荔草抽芽",
  蚯蚓结: "蚯蚓蜷缩",
  麋角解: "麋鹿角脱落",
  水泉动: "山泉开始流动",
  雁北乡: "大雁北飞",
  鹊始巢: "喜鹊筑巢",
  雉始雊: "野鸡鸣叫",
  鸡始乳: "母鸡孵蛋",
  征鸟厉疾: "鹰隼盘旋疾飞",
  水泽腹坚: "水域冰厚坚实",
};
const NW_XIAOXI = ["复", "临", "泰", "大壮", "夬", "乾", "姤", "遁", "否", "观", "剥", "坤"]; // 子月…亥月 十二消息卦
const NW_XIAOXI_TXT = [
  "一阳生,阳气初动",
  "二阳,渐进",
  "三阳开泰",
  "四阳,阳气壮盛",
  "五阳,将至极盛",
  "六阳纯,阳极盛",
  "一阴生,阴气初萌",
  "二阴,渐退",
  "三阴,天地不交",
  "四阴,观而收敛",
  "五阴,剥落将尽",
  "六阴纯,阴极盛",
];
const NW_JCHU_TXT = {
  建: "万物建立、宜起步",
  除: "除旧布新、宜清理",
  满: "盈满、宜聚集庆贺",
  平: "平和、宜平稳办事",
  定: "安定、宜定约、决策",
  执: "执守、宜执行落实",
  破: "破损、宜破旧拆除",
  危: "危机、宜谨慎",
  成: "成就、宜成事",
  收: "收获、宜收纳",
  开: "开通、宜开始",
  闭: "闭藏、宜收敛静养",
};
const NW_GENG = ["更", "点"];
const NW_WUGENG = [
  ["一更", "戌"],
  ["二更", "亥"],
  ["三更", "子"],
  ["四更", "丑"],
  ["五更", "寅"],
];

/* ---- 太阳/月亮位置 ---- */
function nwEps(T) {
  return (23.439291 - 0.0130042 * T) * D2R;
}
function nwGmst(jd) {
  const T = (jd - 2451545) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
}
function nwHorizon(raDeg, decRad, jd, lonE, latN) {
  const H = (nwGmst(jd) + lonE - raDeg) * D2R,
    phi = latN * D2R;
  const sinAlt = Math.sin(phi) * Math.sin(decRad) + Math.cos(phi) * Math.cos(decRad) * Math.cos(H);
  const alt = Math.asin(Math.max(-1, Math.min(1, sinAlt)));
  const az = Math.atan2(
    Math.sin(H),
    Math.cos(H) * Math.sin(phi) - Math.tan(decRad) * Math.cos(phi),
  );
  return { alt: alt / D2R, az: norm360(az / D2R + 180), H: norm360(H / D2R) };
}
function nwSun(jd, lonE, latN) {
  const T = (jd - 2451545) / 36525,
    eps = nwEps(T),
    lam = sunLon(jd) * D2R;
  const dec = Math.asin(Math.sin(eps) * Math.sin(lam)),
    ra = norm360(Math.atan2(Math.cos(eps) * Math.sin(lam), Math.cos(lam)) / D2R);
  const h = nwHorizon(ra, dec, jd, lonE, latN);
  // 视差与大气折射(仅用于近地平线的显示):取标准折射
  let refr = 0;
  if (h.alt > -1) {
    const a = h.alt < -0.575 ? 0 : h.alt;
    refr = 1.02 / Math.tan((a + 10.3 / (a + 5.11)) * D2R) / 60;
  }
  return {
    alt: h.alt,
    altApp: h.alt + refr,
    az: h.az,
    dec: dec / D2R,
    ra,
    H: h.H,
    lon: sunLon(jd),
  };
}
function asMoonLat(T) {
  const Lp = 218.3164477 + 481267.88123421 * T,
    D = 297.8501921 + 445267.1114034 * T,
    M = 357.5291092 + 35999.0502909 * T,
    Mp = 134.9633964 + 477198.8675055 * T,
    F = 93.272095 + 483202.0175233 * T;
  const E = 1 - 0.002516 * T,
    r = (x) => Math.sin(x * D2R);
  return (
    5.128122 * r(F) +
    0.280602 * r(Mp + F) +
    0.277693 * r(Mp - F) +
    0.173237 * r(2 * D - F) +
    0.055413 * r(2 * D - Mp + F) +
    0.046271 * r(2 * D - Mp - F) +
    0.032573 * r(2 * D + F) +
    0.017198 * r(2 * Mp + F) +
    0.009266 * r(2 * D + Mp - F) +
    0.008822 * r(2 * Mp - F) +
    0.008216 * E * r(2 * D - M - F) +
    0.004324 * r(2 * D - 2 * Mp - F) +
    0.0042 * r(2 * D + Mp + F) -
    0.003359 * E * r(M + F - 2 * D) * -1 +
    0.002463 * E * r(2 * D - M - Mp + F) +
    0.002211 * E * r(2 * D - M + F) +
    0.002065 * E * r(2 * D - M - Mp - F) -
    0.00187 * E * r(M - Mp - F) +
    0.001828 * r(4 * D - Mp - F)
  );
}
function nwMoon(jd, lonE, latN) {
  const T = (jd - 2451545) / 36525,
    eps = nwEps(T),
    lam = asMoonLon(T) * D2R,
    bet = asMoonLat(T) * D2R;
  const dec = Math.asin(
    Math.sin(bet) * Math.cos(eps) + Math.cos(bet) * Math.sin(eps) * Math.sin(lam),
  );
  const ra = norm360(
    Math.atan2(Math.sin(lam) * Math.cos(eps) - Math.tan(bet) * Math.sin(eps), Math.cos(lam)) / D2R,
  );
  const h = nwHorizon(ra, dec, jd, lonE, latN);
  const par = Math.asin(Math.sin(0.9508 * D2R) * Math.cos(h.alt * D2R)) / D2R; // 地平视差(粗)
  return {
    alt: h.alt - par,
    az: h.az,
    dec: dec / D2R,
    ra,
    lon: norm360(lam / D2R),
    lat: bet / D2R,
  };
}
/* 某“北京日期”的升落:在 [00:00,24:00) 内找 alt 穿越 h0 的时刻,返回 {rise,set,noon}(北京时间小时,可能为 null) */
function nwRiseSet(y, m, d, lonE, latN, body, h0o) {
  const base = jdFromGreg(y, m, d, 0) - 8 / 24;
  const h0 = h0o !== undefined ? h0o : body === "sun" ? -0.833 : -0.83;
  const f = (t) => (body === "sun" ? nwSun(t, lonE, latN).alt : nwMoon(t, lonE, latN).alt) - h0;
  let rise = null,
    set = null,
    prev = f(base),
    best = { t: base, a: -99 };
  const step = 8 / 1440;
  for (let t = base + step; t <= base + 1 + 1e-9; t += step) {
    const cur = f(t);
    if (prev < 0 && cur >= 0) {
      let a = t - step,
        b = t;
      for (let k = 0; k < 30; k++) {
        const mid = (a + b) / 2;
        if (f(mid) < 0) a = mid;
        else b = mid;
      }
      if (rise === null) rise = (a + b) / 2;
    }
    if (prev >= 0 && cur < 0) {
      let a = t - step,
        b = t;
      for (let k = 0; k < 30; k++) {
        const mid = (a + b) / 2;
        if (f(mid) >= 0) a = mid;
        else b = mid;
      }
      if (set === null) set = (a + b) / 2;
    }
    if (cur + h0 > best.a) {
      best = { t, a: cur + h0 };
    }
    prev = cur;
  }
  const hh = (t) => (t === null ? null : (t - base) * 24);
  return {
    rise: hh(rise),
    set: hh(set),
    noon: hh(best.t),
    maxAlt: best.a,
    alwaysUp: rise === null && set === null && f(base) >= 0,
    alwaysDown: rise === null && set === null && f(base) < 0,
  };
}
const nwFmtH = (h) => {
  if (h === null || h === undefined) return "—";
  const m = Math.round(h * 60);
  return f2(Math.floor(m / 60) % 24) + ":" + f2(m % 60);
};
/* ---- 月相与朔望 ---- */
function nwElong(jd) {
  const T = (jd - 2451545) / 36525;
  return norm360(asMoonLon(T) - sunLon(jd));
}
function nwNextPhase(jd, targetDeg) {
  // 下一个 elongation=target 的时刻
  let t = jd;
  for (let k = 0; k < 12; k++) {
    const el = nwElong(t);
    let d = ((targetDeg - el + 540) % 360) - 180; // 需前进 d 度
    if (k === 0 && d < 0) d += 360;
    t += d / 12.19;
    if (Math.abs(d) < 1e-5) break;
  }
  return t;
}
function nwPrevPhase(jd, targetDeg) {
  let t = jd;
  for (let k = 0; k < 12; k++) {
    const el = nwElong(t);
    let d = ((targetDeg - el + 540) % 360) - 180;
    if (k === 0 && d > 0) d -= 360;
    t += d / 12.19;
    if (Math.abs(d) < 1e-5) break;
  }
  return t;
}
function nwMoonSvg(el, size) {
  // 月相图标
  const R = size / 2,
    k = Math.cos(el * D2R),
    waxing = el < 180,
    c = R;
  const dark = "var(--panel2)",
    lit = "var(--gold2)";
  // 亮面:外缘半圆 + 终止线椭圆弧
  const rx = Math.abs(k) * R,
    sweepOuter = waxing ? 1 : 0;
  const path = `M ${c} 0 A ${R} ${R} 0 0 ${sweepOuter} ${c} ${size} A ${rx.toFixed(2)} ${R} 0 0 ${waxing ? (k > 0 ? 0 : 1) : k > 0 ? 1 : 0} ${c} 0 Z`;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" class="moonic"><circle cx="${c}" cy="${c}" r="${R - 1}" fill="${dark}" stroke="var(--line2)"/><path d="${path}" fill="${lit}" opacity=".92"/></svg>`;
}
/* ---- 三伏 / 数九 ---- */
function nwDayNum(y, m, d) {
  return Math.floor(jdFromGreg(y, m, d, 12) + 0.5 + 1e-9);
}
function nwDayIdx(y, m, d) {
  return (((nwDayNum(y, m, d) + 49) % 60) + 60) % 60;
}
function nwTermDate(target, year, approxMonth) {
  // 目标黄经所在年的北京日期
  const jd = termJD(target, jdFromGreg(year, approxMonth, 15) - 8 / 24),
    f = fromJD(jd + 8 / 24);
  return { y: f.y, m: f.m, d: f.d, jd };
}
function nwShujiu(y, m, d) {
  const cur = nwDayNum(y, m, d);
  let dz = nwTermDate(270, y, 12);
  let dzN = nwDayNum(dz.y, dz.m, dz.d);
  if (dzN > cur) {
    dz = nwTermDate(270, y - 1, 12);
    dzN = nwDayNum(dz.y, dz.m, dz.d);
  }
  const k = cur - dzN;
  if (k < 0 || k >= 81) return null;
  return {
    name: ["一", "二", "三", "四", "五", "六", "七", "八", "九"][Math.floor(k / 9)] + "九",
    day: (k % 9) + 1,
    k,
  };
}
function nwFu(y, m, d) {
  const cur = nwDayNum(y, m, d);
  const xz = nwTermDate(90, y, 6),
    lq = nwTermDate(135, y, 8);
  const xzN = nwDayNum(xz.y, xz.m, xz.d),
    lqN = nwDayNum(lq.y, lq.m, lq.d);
  const gengOn = (n) => ((((n + 49) % 60) + 60) % 60) % 10 === 6;
  let n = xzN,
    c = 0,
    chu = null;
  for (; ; n++) {
    if (gengOn(n)) {
      c++;
      if (c === 3) {
        chu = n;
        break;
      }
    }
  }
  let zhong = chu + 10; // 第四个庚日
  let mo = lqN;
  while (!gengOn(mo)) mo++;
  if (cur < chu || cur >= mo + 10) return null;
  if (cur < zhong) return { name: "初伏", day: cur - chu + 1 };
  if (cur < mo) return { name: "中伏", day: cur - zhong + 1 };
  return { name: "末伏", day: cur - mo + 1 };
}
/* ---- 候 ---- */
function nwHou(jdLocNow) {
  // jdLocNow:北京时间儒略日(含小数)
  // 最近一个已到的节气(仅取 24 节气)与其北京日期
  const y = fromJD(jdLocNow).y;
  let best = null;
  for (const yy of [y - 1, y, y + 1]) {
    for (let i = 0; i < 24; i++) {
      const lon = (315 + i * 15) % 360;
      const g = jdFromGreg(yy, 2, 4) + i * 15.2184 - 0.3;
      const jd = termJD(lon, g);
      if (jd + 8 / 24 <= jdLocNow && (best === null || jd > best.jd)) best = { i, jd, lon };
    }
  }
  const tf = fromJD(best.jd + 8 / 24),
    nowf = fromJD(jdLocNow);
  const dd = nwDayNum(nowf.y, nowf.m, nowf.d) - nwDayNum(tf.y, tf.m, tf.d);
  const hi = Math.min(2, Math.floor(dd / 5));
  const term = NW_HOU[best.i][0],
    name = NW_HOU[best.i][1][hi];
  // 该候的起止(以黄经每 5° 折算的时间进度)
  const lonNow = sunLon(jdLocNow - 8 / 24),
    prog = (((lonNow - best.lon + 360) % 360) - hi * 5) / 5;
  return {
    termIdx: best.i,
    term,
    hi,
    name,
    ord: NW_HOU_ORD[hi],
    days: dd,
    progress: Math.max(0, Math.min(1, prog)),
    meaning: NW_HOU_MEAN[name] || "",
  };
}
/* ---- 节气序列 ---- */
function nwTermList(jdUT, n) {
  const lon = sunLon(jdUT);
  let k = Math.floor(lon / 15);
  const out = [];
  const T24 = [
    "春分",
    "清明",
    "谷雨",
    "立夏",
    "小满",
    "芒种",
    "夏至",
    "小暑",
    "大暑",
    "立秋",
    "处暑",
    "白露",
    "秋分",
    "寒露",
    "霜降",
    "立冬",
    "小雪",
    "大雪",
    "冬至",
    "小寒",
    "大寒",
    "立春",
    "雨水",
    "惊蛰",
  ];
  let prev = termJD((k * 15) % 360, jdUT - ((lon - k * 15 + 360) % 360) / 0.9856);
  out.push({ name: T24[k % 24], jd: prev, past: true });
  for (let i = 1; i <= n; i++) {
    const kk = (k + i) % 24;
    const jd = termJD((kk * 15) % 360, jdUT + ((kk * 15 - lon + 720) % 360) / 0.9856);
    out.push({ name: T24[kk], jd, past: false, zhong: kk % 2 === 0 });
  }
  return out;
}
/* ---- 时辰:刻与更 ---- */
function nwShichen(locH, locM, locS) {
  const mins = locH * 60 + locM + locS / 60,
    b = Math.floor(((mins + 60) % 1440) / 120) % 12;
  const start = (b * 120 - 60 + 1440) % 1440,
    el = (((mins - start) % 1440) + 1440) % 1440; // 已过分钟(0..120)
  const half = el < 60 ? "初" : "正",
    inHalf = el % 60,
    ke = Math.floor(inHalf / 15) + 1;
  const remain = 120 - el;
  let geng = null;
  const g = [
    [19, 21],
    [21, 23],
    [23, 25],
    [25, 27],
    [27, 29],
  ];
  const hh = mins / 60,
    h2 = hh < 5 ? hh + 24 : hh;
  for (let i = 0; i < 5; i++) {
    if (h2 >= g[i][0] && h2 < g[i][1]) geng = NW_WUGENG[i][0];
  }
  return {
    b,
    half,
    ke,
    el,
    remain,
    pct: el / 120,
    geng,
    label: ZHI[b] + "时" + half + ["一", "二", "三", "四"][ke - 1] + "刻",
  };
}

/* =====================================================================
   未来 24 小时时辰条 · 节气物候年历
   ===================================================================== */
function nwHourBlocks(n, shiftMin, count) {
  // n:北京时间 {y,m,d,h,mi,s};shiftMin:真太阳时差(分),用于时辰边界;返回从当前时辰起的 count 个时辰块
  const locH = n.h + n.mi / 60 + n.s / 3600 + (shiftMin || 0) / 60;
  const k0 = Math.floor((locH + 1) / 2);
  const day0 = jdFromGreg(n.y, n.m, n.d, 0),
    out = [];
  const cache = {};
  for (let i = 0; i < count; i++) {
    const j = k0 + i,
      b = ((j % 12) + 12) % 12,
      sH = 2 * j - 1,
      eH = 2 * j + 1;
    const off = Math.floor((2 * j) / 24);
    const ed = fromJD(jdFromGreg(n.y, n.m, n.d, 12) + off);
    const key = ed.y + "-" + ed.m + "-" + ed.d;
    const tab = cache[key] || (cache[key] = hoursOfDay(ed.y, ed.m, ed.d));
    const h = tab[b];
    const sJD = day0 + (sH - (shiftMin || 0) / 60) / 24,
      eJD = day0 + (eH - (shiftMin || 0) / 60) / 24; // 北京时间儒略日(以 00:00 为整数点)
    out.push(Object.assign({}, h, { j, i, sJD, eJD, lz: ZW_LZ[b], isNow: i === 0, day: ed }));
  }
  return out;
}
const nwBJfromJD = (jd) => fromJD(jd);
/* 节气物候年历 */
const NW_TERM_ORDER = [
  ["小寒", 285],
  ["大寒", 300],
  ["立春", 315],
  ["雨水", 330],
  ["惊蛰", 345],
  ["春分", 0],
  ["清明", 15],
  ["谷雨", 30],
  ["立夏", 45],
  ["小满", 60],
  ["芒种", 75],
  ["夏至", 90],
  ["小暑", 105],
  ["大暑", 120],
  ["立秋", 135],
  ["处暑", 150],
  ["白露", 165],
  ["秋分", 180],
  ["寒露", 195],
  ["霜降", 210],
  ["立冬", 225],
  ["小雪", 240],
  ["大雪", 255],
  ["冬至", 270],
];
const NW_TERM_TIPS = {
  小寒: "天渐寒,尚未极冷。习俗:腊八(喝腊八粥)。养生:防寒保暖,温补。农事:护苗防冻。",
  大寒: "一年中最冷的时段之一。习俗:尾牙、除旧布新、备年货。养生:温补,防寒。",
  立春: "春季开始。习俗:迎春、打春、吃春饼春卷。养生:养肝,早睡早起、舒展筋骨。农事:备耕。",
  雨水: "降雨渐增、冰雪消融。习俗:回娘家、拉保保(部分地区)。养生:祛湿健脾。",
  惊蛰: "春雷始鸣,蛰虫惊醒。习俗:吃梨、祭白虎(部分地区)。养生:防春困、饮食清淡。",
  春分: "昼夜平分。习俗:竖蛋、祭日、踏青。养生:阴阳平衡、作息规律。",
  清明: "天清地明,踏青扫墓。习俗:祭祖、踏青、插柳、吃青团。养生:防过敏、注意保暖。",
  谷雨: "雨生百谷。习俗:喝谷雨茶、赏牡丹。养生:祛湿、防关节不适。农事:播种忙。",
  立夏: "夏季开始。习俗:称人、吃立夏蛋、尝新。养生:养心,午间小憩。",
  小满: "夏熟作物籽粒渐满。习俗:祭蚕神(江南)。养生:清热利湿,防皮肤问题。",
  芒种: "麦熟稻播的农忙时节。习俗:送花神、煮梅。养生:防暑,晚睡早起注意午休。",
  夏至: "昼最长夜最短。习俗:吃面(北方)、祭祖。养生:防暑养阴,保持心静。",
  小暑: "正式入暑。习俗:食新、吃伏面。养生:防暑祛湿,饮食清淡。",
  大暑: "最热的时段。习俗:喝伏茶、送大暑船(浙东)。养生:防中暑,补水。",
  立秋: "秋季开始(暑热未退)。习俗:贴秋膘、啃秋。养生:润燥养肺。",
  处暑: "暑气渐止。习俗:出游迎秋、吃鸭。养生:防秋燥,早睡早起。",
  白露: "露凝而白,早晚渐凉。习俗:喝白露茶(部分地区)。养生:防寒保暖,注意“白露身不露”。",
  秋分: "昼夜平分。习俗:祭月(古)、吃秋菜(岭南)。养生:润燥,平和情绪。",
  寒露: "露寒欲凝。习俗:登高、赏菊、吃芝麻。养生:保暖养阴,防干燥。",
  霜降: "初霜将至,秋季最后一个节气。习俗:赏红叶、吃柿子。养生:防寒护胃。",
  立冬: "冬季开始。习俗:补冬、吃饺子(北方)。养生:养肾藏精,早卧晚起。",
  小雪: "初雪。习俗:腌菜、晒鱼干。养生:保暖、防情绪低落。",
  大雪: "降雪增多。习俗:进补、腌肉。养生:温补,注意防寒。",
  冬至: "昼最短夜最长,阴极阳生。习俗:吃饺子/汤圆、祭祖。养生:养阳藏精;数九自今日起。",
};
function nwSeasonYear(y) {
  const out = [];
  const gJD = (i) => jdFromGreg(y, 1, 5) + i * 15.2184 - 0.3;
  for (let i = 0; i < 24; i++) {
    const [name, lon] = NW_TERM_ORDER[i],
      jd = termJD(lon, gJD(i)),
      bj = fromJD(jd + 8 / 24);
    out.push({
      name,
      lon,
      jd,
      bj,
      dn: nwDayNum(bj.y, bj.m, bj.d),
      zhong: [
        "大寒",
        "雨水",
        "春分",
        "谷雨",
        "小满",
        "夏至",
        "大暑",
        "处暑",
        "秋分",
        "霜降",
        "小雪",
        "冬至",
      ].includes(name),
    });
  }
  const nextXH = termJD(285, jdFromGreg(y + 1, 1, 5) - 0.3),
    nx = fromJD(nextXH + 8 / 24),
    nxDn = nwDayNum(nx.y, nx.m, nx.d);
  out.forEach((t, i) => {
    const end = i < 23 ? out[i + 1].dn : nxDn,
      hou = NW_HOU.find((h) => h[0] === t.name)[1];
    t.hou = [0, 1, 2].map((k) => ({
      name: hou[k],
      s: t.dn + 5 * k,
      e: k < 2 ? t.dn + 5 * k + 4 : end - 1,
    }));
    t.endDn = end - 1;
  });
  return out;
}
const nwDnToDate = (dn) => {
  const f = fromJD(dn - 0.5 + 0.5 + 0.0);
  return f;
};
function nwDnFmt(dn) {
  const f = fromJD(dn + 0.0 - 0.0);
  return f;
}
function nwFuRanges(y) {
  const xz = nwTermDate(90, y, 6),
    lq = nwTermDate(135, y, 8);
  const xzN = nwDayNum(xz.y, xz.m, xz.d),
    lqN = nwDayNum(lq.y, lq.m, lq.d);
  const gengOn = (n) => ((((n + 49) % 60) + 60) % 60) % 10 === 6;
  let n = xzN,
    c = 0,
    chu;
  for (; ; n++) {
    if (gengOn(n)) {
      c++;
      if (c === 3) {
        chu = n;
        break;
      }
    }
  }
  const zhong = chu + 10;
  let mo = lqN;
  while (!gengOn(mo)) mo++;
  return [
    { name: "初伏", s: chu, e: chu + 9 },
    { name: "中伏", s: zhong, e: mo - 1 },
    { name: "末伏", s: mo, e: mo + 9 },
  ];
}
function nwJiuRanges(y) {
  // 自 y 年冬至起的九个九
  const dz = nwTermDate(270, y, 12),
    s = nwDayNum(dz.y, dz.m, dz.d);
  return [...Array(9)].map((_, i) => ({
    name: ["一", "二", "三", "四", "五", "六", "七", "八", "九"][i] + "九",
    s: s + 9 * i,
    e: s + 9 * i + 8,
  }));
}

/* =====================================================================
   万年历:公历/农历/干支、节气、传统节日、神明诞辰、法定假日、黄历宜忌与方位民俗
   节日、神诞(道教圣诞、佛菩萨诞)、法定假日(2001–2026)、彭祖百忌、胎神、财喜福贵神方位取自开源历法库的数据体系并逐日对拍;
   “民间神诞”为补充的通行说法,各地日期不一,已单独标注。
   ===================================================================== */
const CAL_DATA = {
  lf: {
    "1-1": "春节",
    "1-15": "元宵节",
    "2-2": "龙头节",
    "5-5": "端午节",
    "7-7": "七夕节",
    "8-15": "中秋节",
    "9-9": "重阳节",
    "12-8": "腊八节",
  },
  lo: {
    "1-4": ["接神日"],
    "1-5": ["隔开日"],
    "1-7": ["人日"],
    "1-8": ["谷日", "顺星节"],
    "1-9": ["天日"],
    "1-10": ["地日"],
    "1-20": ["天穿节"],
    "1-25": ["填仓节"],
    "1-30": ["正月晦"],
    "2-1": ["中和节"],
    "2-2": ["社日节"],
    "3-3": ["上巳节"],
    "5-20": ["分龙节"],
    "5-25": ["会龙节"],
    "6-6": ["天贶节"],
    "6-24": ["观莲节"],
    "6-25": ["五谷母节"],
    "7-15": ["中元节"],
    "7-22": ["财神节"],
    "7-29": ["地藏节"],
    "8-1": ["天灸日"],
    "10-1": ["寒衣节"],
    "10-10": ["十成节"],
    "10-15": ["下元节"],
    "12-7": ["驱傩日"],
    "12-16": ["尾牙"],
    "12-24": ["祭灶日"],
  },
  sf: {
    "1-1": "元旦节",
    "2-14": "情人节",
    "3-8": "妇女节",
    "3-12": "植树节",
    "3-15": "消费者权益日",
    "4-1": "愚人节",
    "5-1": "劳动节",
    "5-4": "青年节",
    "6-1": "儿童节",
    "7-1": "建党节",
    "8-1": "建军节",
    "9-10": "教师节",
    "10-1": "国庆节",
    "10-31": "万圣节前夜",
    "11-1": "万圣节",
    "12-24": "平安夜",
    "12-25": "圣诞节",
  },
  so: {
    "1-8": ["周恩来逝世纪念日"],
    "1-10": ["中国人民警察节"],
    "1-14": ["日记情人节"],
    "1-21": ["列宁逝世纪念日"],
    "1-26": ["国际海关日"],
    "1-27": ["国际大屠杀纪念日"],
    "2-2": ["世界湿地日"],
    "2-4": ["世界抗癌日"],
    "2-7": ["京汉铁路罢工纪念日"],
    "2-10": ["国际气象节"],
    "2-19": ["邓小平逝世纪念日"],
    "2-20": ["世界社会公正日"],
    "2-21": ["国际母语日"],
    "2-24": ["第三世界青年日"],
    "3-1": ["国际海豹日"],
    "3-3": ["世界野生动植物日", "全国爱耳日"],
    "3-5": ["周恩来诞辰纪念日", "中国青年志愿者服务日"],
    "3-6": ["世界青光眼日"],
    "3-7": ["女生节"],
    "3-12": ["孙中山逝世纪念日"],
    "3-14": ["马克思逝世纪念日", "白色情人节"],
    "3-17": ["国际航海日"],
    "3-18": ["全国科技人才活动日", "全国爱肝日"],
    "3-20": ["国际幸福日"],
    "3-21": ["世界森林日", "世界睡眠日", "国际消除种族歧视日"],
    "3-22": ["世界水日"],
    "3-23": ["世界气象日"],
    "3-24": ["世界防治结核病日"],
    "3-29": ["中国黄花岗七十二烈士殉难纪念日"],
    "4-2": ["国际儿童图书日", "世界自闭症日"],
    "4-4": ["国际地雷行动日"],
    "4-7": ["世界卫生日"],
    "4-8": ["国际珍稀动物保护日"],
    "4-12": ["世界航天日"],
    "4-14": ["黑色情人节"],
    "4-15": ["全民国家安全教育日"],
    "4-22": ["世界地球日", "列宁诞辰纪念日"],
    "4-23": ["世界读书日"],
    "4-24": ["中国航天日"],
    "4-25": ["儿童预防接种宣传日"],
    "4-26": ["世界知识产权日", "全国疟疾日"],
    "4-28": ["世界安全生产与健康日"],
    "4-30": ["全国交通安全反思日"],
    "5-2": ["世界金枪鱼日"],
    "5-3": ["世界新闻自由日"],
    "5-5": ["马克思诞辰纪念日"],
    "5-8": ["世界红十字日"],
    "5-11": ["世界肥胖日"],
    "5-12": ["全国防灾减灾日", "护士节"],
    "5-14": ["玫瑰情人节"],
    "5-15": ["国际家庭日"],
    "5-19": ["中国旅游日"],
    "5-20": ["网络情人节"],
    "5-22": ["国际生物多样性日"],
    "5-25": ["525心理健康节"],
    "5-27": ["上海解放日"],
    "5-29": ["国际维和人员日"],
    "5-30": ["中国五卅运动纪念日"],
    "5-31": ["世界无烟日"],
    "6-3": ["世界自行车日"],
    "6-5": ["世界环境日"],
    "6-6": ["全国爱眼日"],
    "6-8": ["世界海洋日"],
    "6-11": ["中国人口日"],
    "6-14": ["世界献血日", "亲亲情人节"],
    "6-17": ["世界防治荒漠化与干旱日"],
    "6-20": ["世界难民日"],
    "6-21": ["国际瑜伽日"],
    "6-25": ["全国土地日"],
    "6-26": ["国际禁毒日", "联合国宪章日"],
    "7-1": ["香港回归纪念日"],
    "7-6": ["国际接吻日", "朱德逝世纪念日"],
    "7-7": ["七七事变纪念日"],
    "7-11": ["世界人口日", "中国航海日"],
    "7-14": ["银色情人节"],
    "7-18": ["曼德拉国际日"],
    "7-30": ["国际友谊日"],
    "8-3": ["男人节"],
    "8-5": ["恩格斯逝世纪念日"],
    "8-6": ["国际电影节"],
    "8-8": ["全民健身日"],
    "8-9": ["国际土著人日"],
    "8-12": ["国际青年节"],
    "8-14": ["绿色情人节"],
    "8-19": ["世界人道主义日", "中国医师节"],
    "8-22": ["邓小平诞辰纪念日"],
    "8-29": ["全国测绘法宣传日"],
    "9-3": ["中国抗日战争胜利纪念日"],
    "9-5": ["中华慈善日"],
    "9-8": ["世界扫盲日"],
    "9-9": ["毛泽东逝世纪念日", "全国拒绝酒驾日"],
    "9-14": ["世界清洁地球日", "相片情人节"],
    "9-15": ["国际民主日"],
    "9-16": ["国际臭氧层保护日"],
    "9-17": ["世界骑行日"],
    "9-18": ["九一八事变纪念日"],
    "9-20": ["全国爱牙日"],
    "9-21": ["国际和平日"],
    "9-27": ["世界旅游日"],
    "9-30": ["中国烈士纪念日"],
    "10-1": ["国际老年人日"],
    "10-2": ["国际非暴力日"],
    "10-4": ["世界动物日"],
    "10-11": ["国际女童日"],
    "10-10": ["辛亥革命纪念日"],
    "10-13": ["国际减轻自然灾害日", "中国少年先锋队诞辰日"],
    "10-14": ["葡萄酒情人节"],
    "10-16": ["世界粮食日"],
    "10-17": ["全国扶贫日"],
    "10-20": ["世界统计日"],
    "10-24": ["世界发展信息日", "程序员节"],
    "10-25": ["抗美援朝纪念日"],
    "11-5": ["世界海啸日"],
    "11-8": ["记者节"],
    "11-9": ["全国消防日"],
    "11-11": ["光棍节"],
    "11-12": ["孙中山诞辰纪念日"],
    "11-14": ["电影情人节"],
    "11-16": ["国际宽容日"],
    "11-17": ["国际大学生节"],
    "11-19": ["世界厕所日"],
    "11-28": ["恩格斯诞辰纪念日"],
    "11-29": ["国际声援巴勒斯坦人民日"],
    "12-1": ["世界艾滋病日"],
    "12-2": ["全国交通安全日"],
    "12-3": ["世界残疾人日"],
    "12-4": ["全国法制宣传日"],
    "12-5": ["世界弱能人士日", "国际志愿人员日"],
    "12-7": ["国际民航日"],
    "12-9": ["世界足球日", "国际反腐败日"],
    "12-10": ["世界人权日"],
    "12-11": ["国际山岳日"],
    "12-12": ["西安事变纪念日"],
    "12-13": ["国家公祭日"],
    "12-14": ["拥抱情人节"],
    "12-18": ["国际移徙者日"],
    "12-26": ["毛泽东诞辰纪念日"],
  },
  wk: {
    "3-0-1": "全国中小学生安全教育日",
    "5-2-0": "母亲节",
    "5-3-0": "全国助残日",
    "6-3-0": "父亲节",
    "9-3-6": "全民国防教育日",
    "10-1-1": "世界住房日",
    "11-4-4": "感恩节",
  },
  tao: {
    "1-1": [["天腊之辰", "天腊，此日五帝会于东方九炁青天"]],
    "1-3": [
      ["郝真人圣诞", ""],
      ["孙真人圣诞", ""],
    ],
    "1-5": [["孙祖清静元君诞", ""]],
    "1-7": [["举迁赏会", "此日上元赐福，天官同地水二官考校罪福"]],
    "1-9": [["玉皇上帝圣诞", ""]],
    "1-13": [["关圣帝君飞升", ""]],
    "1-15": [
      ["上元天官圣诞", ""],
      ["老祖天师圣诞", ""],
    ],
    "1-19": [["长春邱真人(邱处机)圣诞", ""]],
    "1-28": [["许真君(许逊天师)圣诞", ""]],
    "2-1": [
      ["勾陈天皇大帝圣诞", ""],
      ["长春刘真人(刘渊然)圣诞", ""],
    ],
    "2-2": [
      ["土地正神诞", ""],
      ["姜太公圣诞", ""],
    ],
    "2-3": [["文昌梓潼帝君圣诞", ""]],
    "2-6": [["东华帝君圣诞", ""]],
    "2-13": [["度人无量葛真君圣诞", ""]],
    "2-15": [["太清道德天尊(太上老君)圣诞", ""]],
    "2-19": [["慈航真人圣诞", ""]],
    "3-1": [["谭祖(谭处端)长真真人圣诞", ""]],
    "3-3": [["玄天上帝圣诞", ""]],
    "3-6": [["眼光娘娘圣诞", ""]],
    "3-15": [
      ["天师张大真人圣诞", ""],
      ["财神赵公元帅圣诞", ""],
    ],
    "3-16": [
      ["三茅真君得道之辰", ""],
      ["中岳大帝圣诞", ""],
    ],
    "3-18": [
      ["王祖(王处一)玉阳真人圣诞", ""],
      ["后土娘娘圣诞", ""],
    ],
    "3-19": [["太阳星君圣诞", ""]],
    "3-20": [["子孙娘娘圣诞", ""]],
    "3-23": [["天后妈祖圣诞", ""]],
    "3-26": [["鬼谷先师诞", ""]],
    "3-28": [["东岳大帝圣诞", ""]],
    "4-1": [["长生谭真君成道之辰", ""]],
    "4-10": [["何仙姑圣诞", ""]],
    "4-14": [["吕祖纯阳祖师圣诞", ""]],
    "4-15": [["钟离祖师圣诞", ""]],
    "4-18": [
      ["北极紫微大帝圣诞", ""],
      ["泰山圣母碧霞元君诞", ""],
      ["华佗神医先师诞", ""],
    ],
    "4-20": [["眼光圣母娘娘诞", ""]],
    "4-28": [["神农先帝诞", ""]],
    "5-1": [["南极长生大帝圣诞", ""]],
    "5-5": [
      ["地腊之辰", "地腊，此日五帝会于南方三炁丹天"],
      ["南方雷祖圣诞", ""],
      ["地祗温元帅圣诞", ""],
      ["雷霆邓天君圣诞", ""],
    ],
    "5-11": [["城隍爷圣诞", ""]],
    "5-13": [
      ["关圣帝君降神", ""],
      ["关平太子圣诞", ""],
    ],
    "5-18": [["张天师圣诞", ""]],
    "5-20": [["马祖丹阳真人圣诞", ""]],
    "5-29": [["紫青白祖师圣诞", ""]],
    "6-1": [["南斗星君下降", ""]],
    "6-2": [["南斗星君下降", ""]],
    "6-3": [["南斗星君下降", ""]],
    "6-4": [["南斗星君下降", ""]],
    "6-5": [["南斗星君下降", ""]],
    "6-6": [["南斗星君下降", ""]],
    "6-10": [["刘海蟾祖师圣诞", ""]],
    "6-15": [["灵官王天君圣诞", ""]],
    "6-19": [["慈航(观音)成道日", ""]],
    "6-23": [["火神圣诞", ""]],
    "6-24": [
      ["南极大帝中方雷祖圣诞", ""],
      ["关圣帝君圣诞", ""],
    ],
    "6-26": [["二郎真君圣诞", ""]],
    "7-7": [
      ["道德腊之辰", "道德腊，此日五帝会于西方七炁素天"],
      ["庆生中会", "此日中元赦罪，地官同天水二官考校罪福"],
    ],
    "7-12": [["西方雷祖圣诞", ""]],
    "7-15": [["中元地官大帝圣诞", ""]],
    "7-18": [["王母娘娘圣诞", ""]],
    "7-20": [["刘祖(刘处玄)长生真人圣诞", ""]],
    "7-22": [["财帛星君文财神增福相公李诡祖圣诞", ""]],
    "7-26": [["张三丰祖师圣诞", ""]],
    "8-1": [["许真君飞升日", ""]],
    "8-3": [["九天司命灶君诞", ""]],
    "8-5": [["北方雷祖圣诞", ""]],
    "8-10": [["北岳大帝诞辰", ""]],
    "8-15": [["太阴星君诞", ""]],
    "9-1": [["北斗九皇降世之辰", ""]],
    "9-2": [["北斗九皇降世之辰", ""]],
    "9-3": [["北斗九皇降世之辰", ""]],
    "9-4": [["北斗九皇降世之辰", ""]],
    "9-5": [["北斗九皇降世之辰", ""]],
    "9-6": [["北斗九皇降世之辰", ""]],
    "9-7": [["北斗九皇降世之辰", ""]],
    "9-8": [["北斗九皇降世之辰", ""]],
    "9-9": [
      ["北斗九皇降世之辰", ""],
      ["斗姥元君圣诞", ""],
      ["重阳帝君圣诞", ""],
      ["玄天上帝飞升", ""],
      ["酆都大帝圣诞", ""],
    ],
    "9-22": [["增福财神诞", ""]],
    "9-23": [["萨翁真君圣诞", ""]],
    "9-28": [["五显灵官马元帅圣诞", ""]],
    "10-1": [
      ["民岁腊之辰", "民岁腊，此日五帝会于北方五炁黑天"],
      ["东皇大帝圣诞", ""],
    ],
    "10-3": [["三茅应化真君圣诞", ""]],
    "10-6": [["天曹诸司五岳五帝圣诞", ""]],
    "10-15": [
      ["下元水官大帝圣诞", ""],
      ["建生大会", "此日下元解厄，水官同天地二官考校罪福"],
    ],
    "10-18": [["地母娘娘圣诞", ""]],
    "10-19": [["长春邱真君飞升", ""]],
    "10-20": [["虚靖天师(即三十代天师弘悟张真人)诞", ""]],
    "11-6": [["西岳大帝圣诞", ""]],
    "11-9": [["湘子韩祖圣诞", ""]],
    "11-11": [["太乙救苦天尊圣诞", ""]],
    "11-26": [["北方五道圣诞", ""]],
    "12-8": [["王侯腊之辰", "王侯腊，此日五帝会于上方玄都玉京"]],
    "12-16": [
      ["南岳大帝圣诞", ""],
      ["福德正神诞", ""],
    ],
    "12-20": [["鲁班先师圣诞", ""]],
    "12-21": [["天猷上帝圣诞", ""]],
    "12-22": [["重阳祖师圣诞", ""]],
    "12-23": [["祭灶王", "最适宜谢旧年太岁，开启拜新年太岁"]],
    "12-25": [
      ["玉帝巡天", ""],
      ["天神下降", ""],
    ],
    "12-29": [["清静孙真君(孙不二)成道", ""]],
  },
  foto: {
    "1-1": ["弥勒菩萨圣诞"],
    "1-6": ["定光佛圣诞"],
    "2-8": ["释迦牟尼佛出家"],
    "2-15": ["释迦牟尼佛涅槃"],
    "2-19": ["观世音菩萨圣诞"],
    "2-21": ["普贤菩萨圣诞"],
    "3-16": ["准提菩萨圣诞"],
    "4-4": ["文殊菩萨圣诞"],
    "4-8": ["释迦牟尼佛圣诞"],
    "4-15": ["佛吉祥日"],
    "4-28": ["药王菩萨圣诞"],
    "5-13": ["伽蓝菩萨圣诞"],
    "6-3": ["韦驮菩萨圣诞"],
    "6-19": ["观音菩萨成道"],
    "7-13": ["大势至菩萨圣诞"],
    "7-15": ["佛欢喜日"],
    "7-24": ["龙树菩萨圣诞"],
    "7-30": ["地藏菩萨圣诞"],
    "8-15": ["月光菩萨圣诞"],
    "8-22": ["燃灯佛圣诞"],
    "9-9": ["摩利支天菩萨圣诞"],
    "9-19": ["观世音菩萨出家"],
    "9-30": ["药师琉璃光佛圣诞"],
    "10-5": ["达摩祖师圣诞"],
    "10-20": ["文殊菩萨出家"],
    "11-17": ["阿弥陀佛圣诞"],
    "11-19": ["日光菩萨圣诞"],
    "12-8": ["释迦牟尼佛成道"],
    "12-23": ["监斋菩萨圣诞"],
    "12-29": ["华严菩萨圣诞"],
  },
  holidays: {
    2001: [
      [12, 29, "元旦节", 1, "2002-01-01"],
      [12, 30, "元旦节", 1, "2002-01-01"],
    ],
    2002: [
      [1, 1, "元旦节", 0, "2002-01-01"],
      [1, 2, "元旦节", 0, "2002-01-01"],
      [1, 3, "元旦节", 0, "2002-01-01"],
      [2, 9, "春节", 1, "2002-02-12"],
      [2, 10, "春节", 1, "2002-02-12"],
      [2, 12, "春节", 0, "2002-02-12"],
      [2, 13, "春节", 0, "2002-02-12"],
      [2, 14, "春节", 0, "2002-02-12"],
      [2, 15, "春节", 0, "2002-02-12"],
      [2, 16, "春节", 0, "2002-02-12"],
      [2, 17, "春节", 0, "2002-02-12"],
      [2, 18, "春节", 0, "2002-02-12"],
      [4, 27, "劳动节", 1, "2002-05-01"],
      [4, 28, "劳动节", 1, "2002-05-01"],
      [5, 1, "劳动节", 0, "2002-05-01"],
      [5, 2, "劳动节", 0, "2002-05-01"],
      [5, 3, "劳动节", 0, "2002-05-01"],
      [5, 4, "劳动节", 0, "2002-05-01"],
      [5, 5, "劳动节", 0, "2002-05-01"],
      [5, 6, "劳动节", 0, "2002-05-01"],
      [5, 7, "劳动节", 0, "2002-05-01"],
      [9, 28, "国庆节", 1, "2002-10-01"],
      [9, 29, "国庆节", 1, "2002-10-01"],
      [10, 1, "国庆节", 0, "2002-10-01"],
      [10, 2, "国庆节", 0, "2002-10-01"],
      [10, 3, "国庆节", 0, "2002-10-01"],
      [10, 4, "国庆节", 0, "2002-10-01"],
      [10, 5, "国庆节", 0, "2002-10-01"],
      [10, 6, "国庆节", 0, "2002-10-01"],
      [10, 7, "国庆节", 0, "2002-10-01"],
    ],
    2003: [
      [1, 1, "元旦节", 0, "2003-01-01"],
      [2, 1, "春节", 0, "2003-02-01"],
      [2, 2, "春节", 0, "2003-02-01"],
      [2, 3, "春节", 0, "2003-02-01"],
      [2, 4, "春节", 0, "2003-02-01"],
      [2, 5, "春节", 0, "2003-02-01"],
      [2, 6, "春节", 0, "2003-02-01"],
      [2, 7, "春节", 0, "2003-02-01"],
      [2, 8, "春节", 1, "2003-02-01"],
      [2, 9, "春节", 1, "2003-02-01"],
      [4, 26, "劳动节", 1, "2003-05-01"],
      [4, 27, "劳动节", 1, "2003-05-01"],
      [5, 1, "劳动节", 0, "2003-05-01"],
      [5, 2, "劳动节", 0, "2003-05-01"],
      [5, 3, "劳动节", 0, "2003-05-01"],
      [5, 4, "劳动节", 0, "2003-05-01"],
      [5, 5, "劳动节", 0, "2003-05-01"],
      [5, 6, "劳动节", 0, "2003-05-01"],
      [5, 7, "劳动节", 0, "2003-05-01"],
      [9, 27, "国庆节", 1, "2003-10-01"],
      [9, 28, "国庆节", 1, "2003-10-01"],
      [10, 1, "国庆节", 0, "2003-10-01"],
      [10, 2, "国庆节", 0, "2003-10-01"],
      [10, 3, "国庆节", 0, "2003-10-01"],
      [10, 4, "国庆节", 0, "2003-10-01"],
      [10, 5, "国庆节", 0, "2003-10-01"],
      [10, 6, "国庆节", 0, "2003-10-01"],
      [10, 7, "国庆节", 0, "2003-10-01"],
    ],
    2004: [
      [1, 1, "元旦节", 0, "2004-01-01"],
      [1, 17, "春节", 1, "2004-01-22"],
      [1, 18, "春节", 1, "2004-01-22"],
      [1, 22, "春节", 0, "2004-01-22"],
      [1, 23, "春节", 0, "2004-01-22"],
      [1, 24, "春节", 0, "2004-01-22"],
      [1, 25, "春节", 0, "2004-01-22"],
      [1, 26, "春节", 0, "2004-01-22"],
      [1, 27, "春节", 0, "2004-01-22"],
      [1, 28, "春节", 0, "2004-01-22"],
      [5, 1, "劳动节", 0, "2004-05-01"],
      [5, 2, "劳动节", 0, "2004-05-01"],
      [5, 3, "劳动节", 0, "2004-05-01"],
      [5, 4, "劳动节", 0, "2004-05-01"],
      [5, 5, "劳动节", 0, "2004-05-01"],
      [5, 6, "劳动节", 0, "2004-05-01"],
      [5, 7, "劳动节", 0, "2004-05-01"],
      [5, 8, "劳动节", 1, "2004-05-01"],
      [5, 9, "劳动节", 1, "2004-05-01"],
      [10, 1, "国庆节", 0, "2004-10-01"],
      [10, 2, "国庆节", 0, "2004-10-01"],
      [10, 3, "国庆节", 0, "2004-10-01"],
      [10, 4, "国庆节", 0, "2004-10-01"],
      [10, 5, "国庆节", 0, "2004-10-01"],
      [10, 6, "国庆节", 0, "2004-10-01"],
      [10, 7, "国庆节", 0, "2004-10-01"],
      [10, 9, "国庆节", 1, "2004-10-01"],
      [10, 10, "国庆节", 1, "2004-10-01"],
    ],
    2005: [
      [1, 1, "元旦节", 0, "2005-01-01"],
      [1, 2, "元旦节", 0, "2005-01-01"],
      [1, 3, "元旦节", 0, "2005-01-01"],
      [2, 5, "春节", 1, "2005-02-09"],
      [2, 6, "春节", 1, "2005-02-09"],
      [2, 9, "春节", 0, "2005-02-09"],
      [2, 10, "春节", 0, "2005-02-09"],
      [2, 11, "春节", 0, "2005-02-09"],
      [2, 12, "春节", 0, "2005-02-09"],
      [2, 13, "春节", 0, "2005-02-09"],
      [2, 14, "春节", 0, "2005-02-09"],
      [2, 15, "春节", 0, "2005-02-09"],
      [4, 30, "劳动节", 1, "2005-05-01"],
      [5, 1, "劳动节", 0, "2005-05-01"],
      [5, 2, "劳动节", 0, "2005-05-01"],
      [5, 3, "劳动节", 0, "2005-05-01"],
      [5, 4, "劳动节", 0, "2005-05-01"],
      [5, 5, "劳动节", 0, "2005-05-01"],
      [5, 6, "劳动节", 0, "2005-05-01"],
      [5, 7, "劳动节", 0, "2005-05-01"],
      [5, 8, "劳动节", 1, "2005-05-01"],
      [10, 1, "国庆节", 0, "2005-10-01"],
      [10, 2, "国庆节", 0, "2005-10-01"],
      [10, 3, "国庆节", 0, "2005-10-01"],
      [10, 4, "国庆节", 0, "2005-10-01"],
      [10, 5, "国庆节", 0, "2005-10-01"],
      [10, 6, "国庆节", 0, "2005-10-01"],
      [10, 7, "国庆节", 0, "2005-10-01"],
      [10, 8, "国庆节", 1, "2005-10-01"],
      [10, 9, "国庆节", 1, "2005-10-01"],
      [12, 31, "元旦节", 1, "2006-01-01"],
    ],
    2006: [
      [1, 1, "元旦节", 0, "2006-01-01"],
      [1, 2, "元旦节", 0, "2006-01-01"],
      [1, 3, "元旦节", 0, "2006-01-01"],
      [1, 28, "春节", 1, "2006-01-29"],
      [1, 29, "春节", 0, "2006-01-29"],
      [1, 30, "春节", 0, "2006-01-29"],
      [1, 31, "春节", 0, "2006-01-29"],
      [2, 1, "春节", 0, "2006-01-29"],
      [2, 2, "春节", 0, "2006-01-29"],
      [2, 3, "春节", 0, "2006-01-29"],
      [2, 4, "春节", 0, "2006-01-29"],
      [2, 5, "春节", 1, "2006-01-29"],
      [4, 29, "劳动节", 1, "2006-05-01"],
      [4, 30, "劳动节", 1, "2006-05-01"],
      [5, 1, "劳动节", 0, "2006-05-01"],
      [5, 2, "劳动节", 0, "2006-05-01"],
      [5, 3, "劳动节", 0, "2006-05-01"],
      [5, 4, "劳动节", 0, "2006-05-01"],
      [5, 5, "劳动节", 0, "2006-05-01"],
      [5, 6, "劳动节", 0, "2006-05-01"],
      [5, 7, "劳动节", 0, "2006-05-01"],
      [9, 30, "国庆节", 1, "2006-10-01"],
      [10, 1, "国庆节", 0, "2006-10-01"],
      [10, 2, "国庆节", 0, "2006-10-01"],
      [10, 3, "国庆节", 0, "2006-10-01"],
      [10, 4, "国庆节", 0, "2006-10-01"],
      [10, 5, "国庆节", 0, "2006-10-01"],
      [10, 6, "国庆节", 0, "2006-10-01"],
      [10, 7, "国庆节", 0, "2006-10-01"],
      [10, 8, "国庆节", 1, "2006-10-01"],
      [12, 30, "元旦节", 1, "2007-01-01"],
      [12, 31, "元旦节", 1, "2007-01-01"],
    ],
    2007: [
      [1, 1, "元旦节", 0, "2007-01-01"],
      [1, 2, "元旦节", 0, "2007-01-01"],
      [1, 3, "元旦节", 0, "2007-01-01"],
      [2, 17, "春节", 1, "2007-02-18"],
      [2, 18, "春节", 0, "2007-02-18"],
      [2, 19, "春节", 0, "2007-02-18"],
      [2, 20, "春节", 0, "2007-02-18"],
      [2, 21, "春节", 0, "2007-02-18"],
      [2, 22, "春节", 0, "2007-02-18"],
      [2, 23, "春节", 0, "2007-02-18"],
      [2, 24, "春节", 0, "2007-02-18"],
      [2, 25, "春节", 1, "2007-02-18"],
      [4, 28, "劳动节", 1, "2007-05-01"],
      [4, 29, "劳动节", 1, "2007-05-01"],
      [5, 1, "劳动节", 0, "2007-05-01"],
      [5, 2, "劳动节", 0, "2007-05-01"],
      [5, 3, "劳动节", 0, "2007-05-01"],
      [5, 4, "劳动节", 0, "2007-05-01"],
      [5, 5, "劳动节", 0, "2007-05-01"],
      [5, 6, "劳动节", 0, "2007-05-01"],
      [5, 7, "劳动节", 0, "2007-05-01"],
      [9, 29, "国庆节", 1, "2007-10-01"],
      [9, 30, "国庆节", 1, "2007-10-01"],
      [10, 1, "国庆节", 0, "2007-10-01"],
      [10, 2, "国庆节", 0, "2007-10-01"],
      [10, 3, "国庆节", 0, "2007-10-01"],
      [10, 4, "国庆节", 0, "2007-10-01"],
      [10, 5, "国庆节", 0, "2007-10-01"],
      [10, 6, "国庆节", 0, "2007-10-01"],
      [10, 7, "国庆节", 0, "2007-10-01"],
      [12, 29, "元旦节", 1, "2008-01-01"],
      [12, 30, "元旦节", 0, "2008-01-01"],
      [12, 31, "元旦节", 0, "2008-01-01"],
    ],
    2008: [
      [1, 1, "元旦节", 0, "2008-01-01"],
      [2, 2, "春节", 1, "2008-02-06"],
      [2, 3, "春节", 1, "2008-02-06"],
      [2, 6, "春节", 0, "2008-02-06"],
      [2, 7, "春节", 0, "2008-02-06"],
      [2, 8, "春节", 0, "2008-02-06"],
      [2, 9, "春节", 0, "2008-02-06"],
      [2, 10, "春节", 0, "2008-02-06"],
      [2, 11, "春节", 0, "2008-02-06"],
      [2, 12, "春节", 0, "2008-02-06"],
      [4, 4, "清明节", 0, "2008-04-04"],
      [4, 5, "清明节", 0, "2008-04-04"],
      [4, 6, "清明节", 0, "2008-04-04"],
      [5, 1, "劳动节", 0, "2008-05-01"],
      [5, 2, "劳动节", 0, "2008-05-01"],
      [5, 3, "劳动节", 0, "2008-05-01"],
      [5, 4, "劳动节", 1, "2008-05-01"],
      [6, 7, "端午节", 0, "2008-06-08"],
      [6, 8, "端午节", 0, "2008-06-08"],
      [6, 9, "端午节", 0, "2008-06-08"],
      [9, 13, "中秋节", 0, "2008-09-14"],
      [9, 14, "中秋节", 0, "2008-09-14"],
      [9, 15, "中秋节", 0, "2008-09-14"],
      [9, 27, "国庆节", 1, "2008-10-01"],
      [9, 28, "国庆节", 1, "2008-10-01"],
      [9, 29, "国庆节", 0, "2008-10-01"],
      [9, 30, "国庆节", 0, "2008-10-01"],
      [10, 1, "国庆节", 0, "2008-10-01"],
      [10, 2, "国庆节", 0, "2008-10-01"],
      [10, 3, "国庆节", 0, "2008-10-01"],
      [10, 4, "国庆节", 0, "2008-10-01"],
      [10, 5, "国庆节", 0, "2008-10-01"],
    ],
    2009: [
      [1, 1, "元旦节", 0, "2009-01-01"],
      [1, 2, "元旦节", 0, "2009-01-01"],
      [1, 3, "元旦节", 0, "2009-01-01"],
      [1, 4, "元旦节", 1, "2009-01-01"],
      [1, 24, "春节", 1, "2009-01-25"],
      [1, 25, "春节", 0, "2009-01-25"],
      [1, 26, "春节", 0, "2009-01-25"],
      [1, 27, "春节", 0, "2009-01-25"],
      [1, 28, "春节", 0, "2009-01-25"],
      [1, 29, "春节", 0, "2009-01-25"],
      [1, 30, "春节", 0, "2009-01-25"],
      [1, 31, "春节", 0, "2009-01-25"],
      [2, 1, "春节", 1, "2009-01-25"],
      [4, 4, "清明节", 0, "2009-04-04"],
      [4, 5, "清明节", 0, "2009-04-04"],
      [4, 6, "清明节", 0, "2009-04-04"],
      [5, 1, "劳动节", 0, "2009-05-01"],
      [5, 2, "劳动节", 0, "2009-05-01"],
      [5, 3, "劳动节", 0, "2009-05-01"],
      [5, 28, "端午节", 0, "2009-05-28"],
      [5, 29, "端午节", 0, "2009-05-28"],
      [5, 30, "端午节", 0, "2009-05-28"],
      [5, 31, "端午节", 1, "2009-05-28"],
      [9, 27, "国庆节", 1, "2009-10-01"],
      [10, 1, "国庆节", 0, "2009-10-01"],
      [10, 2, "国庆节", 0, "2009-10-01"],
      [10, 3, "国庆节", 0, "2009-10-01"],
      [10, 4, "国庆节", 0, "2009-10-01"],
      [10, 5, "中秋节", 0, "2009-10-03"],
      [10, 6, "中秋节", 0, "2009-10-03"],
      [10, 7, "中秋节", 0, "2009-10-03"],
      [10, 8, "中秋节", 0, "2009-10-03"],
      [10, 10, "中秋节", 1, "2009-10-03"],
    ],
    2010: [
      [1, 1, "元旦节", 0, "2010-01-01"],
      [1, 2, "元旦节", 0, "2010-01-01"],
      [1, 3, "元旦节", 0, "2010-01-01"],
      [2, 13, "春节", 0, "2010-02-13"],
      [2, 14, "春节", 0, "2010-02-13"],
      [2, 15, "春节", 0, "2010-02-13"],
      [2, 16, "春节", 0, "2010-02-13"],
      [2, 17, "春节", 0, "2010-02-13"],
      [2, 18, "春节", 0, "2010-02-13"],
      [2, 19, "春节", 0, "2010-02-13"],
      [2, 20, "春节", 1, "2010-02-13"],
      [2, 21, "春节", 1, "2010-02-13"],
      [4, 3, "清明节", 0, "2010-04-05"],
      [4, 4, "清明节", 0, "2010-04-05"],
      [4, 5, "清明节", 0, "2010-04-05"],
      [5, 1, "劳动节", 0, "2010-05-01"],
      [5, 2, "劳动节", 0, "2010-05-01"],
      [5, 3, "劳动节", 0, "2010-05-01"],
      [6, 12, "端午节", 1, "2010-06-16"],
      [6, 13, "端午节", 1, "2010-06-16"],
      [6, 14, "端午节", 0, "2010-06-16"],
      [6, 15, "端午节", 0, "2010-06-16"],
      [6, 16, "端午节", 0, "2010-06-16"],
      [9, 19, "中秋节", 1, "2010-09-22"],
      [9, 22, "中秋节", 0, "2010-09-22"],
      [9, 23, "中秋节", 0, "2010-09-22"],
      [9, 24, "中秋节", 0, "2010-09-22"],
      [9, 25, "中秋节", 1, "2010-09-22"],
      [9, 26, "国庆节", 1, "2010-10-01"],
      [10, 1, "国庆节", 0, "2010-10-01"],
      [10, 2, "国庆节", 0, "2010-10-01"],
      [10, 3, "国庆节", 0, "2010-10-01"],
      [10, 4, "国庆节", 0, "2010-10-01"],
      [10, 5, "国庆节", 0, "2010-10-01"],
      [10, 6, "国庆节", 0, "2010-10-01"],
      [10, 7, "国庆节", 0, "2010-10-01"],
      [10, 9, "国庆节", 1, "2010-10-01"],
    ],
    2011: [
      [1, 1, "元旦节", 0, "2011-01-01"],
      [1, 2, "元旦节", 0, "2011-01-01"],
      [1, 3, "元旦节", 0, "2011-01-01"],
      [1, 30, "春节", 1, "2011-02-03"],
      [2, 2, "春节", 0, "2011-02-03"],
      [2, 3, "春节", 0, "2011-02-03"],
      [2, 4, "春节", 0, "2011-02-03"],
      [2, 5, "春节", 0, "2011-02-03"],
      [2, 6, "春节", 0, "2011-02-03"],
      [2, 7, "春节", 0, "2011-02-03"],
      [2, 8, "春节", 0, "2011-02-03"],
      [2, 12, "春节", 1, "2011-02-03"],
      [4, 2, "清明节", 1, "2011-04-05"],
      [4, 3, "清明节", 0, "2011-04-05"],
      [4, 4, "清明节", 0, "2011-04-05"],
      [4, 5, "清明节", 0, "2011-04-05"],
      [4, 30, "劳动节", 0, "2011-05-01"],
      [5, 1, "劳动节", 0, "2011-05-01"],
      [5, 2, "劳动节", 0, "2011-05-01"],
      [6, 4, "端午节", 0, "2011-06-06"],
      [6, 5, "端午节", 0, "2011-06-06"],
      [6, 6, "端午节", 0, "2011-06-06"],
      [9, 10, "中秋节", 0, "2011-09-12"],
      [9, 11, "中秋节", 0, "2011-09-12"],
      [9, 12, "中秋节", 0, "2011-09-12"],
      [10, 1, "国庆节", 0, "2011-10-01"],
      [10, 2, "国庆节", 0, "2011-10-01"],
      [10, 3, "国庆节", 0, "2011-10-01"],
      [10, 4, "国庆节", 0, "2011-10-01"],
      [10, 5, "国庆节", 0, "2011-10-01"],
      [10, 6, "国庆节", 0, "2011-10-01"],
      [10, 7, "国庆节", 0, "2011-10-01"],
      [10, 8, "国庆节", 1, "2011-10-01"],
      [10, 9, "国庆节", 1, "2011-10-01"],
      [12, 31, "元旦节", 1, "2012-01-01"],
    ],
    2012: [
      [1, 1, "元旦节", 0, "2012-01-01"],
      [1, 2, "元旦节", 0, "2012-01-01"],
      [1, 3, "元旦节", 0, "2012-01-01"],
      [1, 21, "春节", 1, "2012-01-23"],
      [1, 22, "春节", 0, "2012-01-23"],
      [1, 23, "春节", 0, "2012-01-23"],
      [1, 24, "春节", 0, "2012-01-23"],
      [1, 25, "春节", 0, "2012-01-23"],
      [1, 26, "春节", 0, "2012-01-23"],
      [1, 27, "春节", 0, "2012-01-23"],
      [1, 28, "春节", 0, "2012-01-23"],
      [1, 29, "春节", 1, "2012-01-23"],
      [3, 31, "清明节", 1, "2012-04-04"],
      [4, 1, "清明节", 1, "2012-04-04"],
      [4, 2, "清明节", 0, "2012-04-04"],
      [4, 3, "清明节", 0, "2012-04-04"],
      [4, 4, "清明节", 0, "2012-04-04"],
      [4, 28, "劳动节", 1, "2012-05-01"],
      [4, 29, "劳动节", 0, "2012-05-01"],
      [4, 30, "劳动节", 0, "2012-05-01"],
      [5, 1, "劳动节", 0, "2012-05-01"],
      [5, 2, "劳动节", 1, "2012-05-01"],
      [6, 22, "端午节", 0, "2012-06-23"],
      [6, 23, "端午节", 0, "2012-06-23"],
      [6, 24, "端午节", 0, "2012-06-23"],
      [9, 29, "中秋节", 1, "2012-09-30"],
      [9, 30, "中秋节", 0, "2012-09-30"],
      [10, 1, "国庆节", 0, "2012-10-01"],
      [10, 2, "国庆节", 0, "2012-10-01"],
      [10, 3, "国庆节", 0, "2012-10-01"],
      [10, 4, "国庆节", 0, "2012-10-01"],
      [10, 5, "国庆节", 0, "2012-10-01"],
      [10, 6, "国庆节", 0, "2012-10-01"],
      [10, 7, "国庆节", 0, "2012-10-01"],
      [10, 8, "国庆节", 1, "2012-10-01"],
    ],
    2013: [
      [1, 1, "元旦节", 0, "2013-01-01"],
      [1, 2, "元旦节", 0, "2013-01-01"],
      [1, 3, "元旦节", 0, "2013-01-01"],
      [1, 5, "元旦节", 1, "2013-01-01"],
      [1, 6, "元旦节", 1, "2013-01-01"],
      [2, 9, "春节", 0, "2013-02-10"],
      [2, 10, "春节", 0, "2013-02-10"],
      [2, 11, "春节", 0, "2013-02-10"],
      [2, 12, "春节", 0, "2013-02-10"],
      [2, 13, "春节", 0, "2013-02-10"],
      [2, 14, "春节", 0, "2013-02-10"],
      [2, 15, "春节", 0, "2013-02-10"],
      [2, 16, "春节", 1, "2013-02-10"],
      [2, 17, "春节", 1, "2013-02-10"],
      [4, 4, "清明节", 0, "2013-04-04"],
      [4, 5, "清明节", 0, "2013-04-04"],
      [4, 6, "清明节", 0, "2013-04-04"],
      [4, 27, "劳动节", 1, "2013-05-01"],
      [4, 28, "劳动节", 1, "2013-05-01"],
      [4, 29, "劳动节", 0, "2013-05-01"],
      [4, 30, "劳动节", 0, "2013-05-01"],
      [5, 1, "劳动节", 0, "2013-05-01"],
      [6, 8, "端午节", 1, "2013-06-12"],
      [6, 9, "端午节", 1, "2013-06-12"],
      [6, 10, "端午节", 0, "2013-06-12"],
      [6, 11, "端午节", 0, "2013-06-12"],
      [6, 12, "端午节", 0, "2013-06-12"],
      [9, 19, "中秋节", 0, "2013-09-19"],
      [9, 20, "中秋节", 0, "2013-09-19"],
      [9, 21, "中秋节", 0, "2013-09-19"],
      [9, 22, "中秋节", 1, "2013-09-19"],
      [9, 29, "国庆节", 1, "2013-10-01"],
      [10, 1, "国庆节", 0, "2013-10-01"],
      [10, 2, "国庆节", 0, "2013-10-01"],
      [10, 3, "国庆节", 0, "2013-10-01"],
      [10, 4, "国庆节", 0, "2013-10-01"],
      [10, 5, "国庆节", 0, "2013-10-01"],
      [10, 6, "国庆节", 0, "2013-10-01"],
      [10, 7, "国庆节", 0, "2013-10-01"],
    ],
    2014: [
      [1, 1, "元旦节", 0, "2014-01-01"],
      [1, 26, "春节", 1, "2014-01-31"],
      [1, 31, "春节", 0, "2014-01-31"],
      [2, 1, "春节", 0, "2014-01-31"],
      [2, 2, "春节", 0, "2014-01-31"],
      [2, 3, "春节", 0, "2014-01-31"],
      [2, 4, "春节", 0, "2014-01-31"],
      [2, 5, "春节", 0, "2014-01-31"],
      [2, 6, "春节", 0, "2014-01-31"],
      [2, 8, "春节", 1, "2014-01-31"],
      [4, 5, "清明节", 0, "2014-04-05"],
      [4, 6, "清明节", 0, "2014-04-05"],
      [4, 7, "清明节", 0, "2014-04-05"],
      [5, 1, "劳动节", 0, "2014-05-01"],
      [5, 2, "劳动节", 0, "2014-05-01"],
      [5, 3, "劳动节", 0, "2014-05-01"],
      [5, 4, "劳动节", 1, "2014-05-01"],
      [5, 31, "端午节", 0, "2014-06-02"],
      [6, 1, "端午节", 0, "2014-06-02"],
      [6, 2, "端午节", 0, "2014-06-02"],
      [9, 6, "中秋节", 0, "2014-09-08"],
      [9, 7, "中秋节", 0, "2014-09-08"],
      [9, 8, "中秋节", 0, "2014-09-08"],
      [9, 28, "国庆节", 1, "2014-10-01"],
      [10, 1, "国庆节", 0, "2014-10-01"],
      [10, 2, "国庆节", 0, "2014-10-01"],
      [10, 3, "国庆节", 0, "2014-10-01"],
      [10, 4, "国庆节", 0, "2014-10-04"],
      [10, 5, "国庆节", 0, "2014-10-01"],
      [10, 6, "国庆节", 0, "2014-10-01"],
      [10, 7, "国庆节", 0, "2014-10-01"],
      [10, 11, "国庆节", 1, "2014-10-01"],
    ],
    2015: [
      [1, 1, "元旦节", 0, "2015-01-01"],
      [1, 2, "元旦节", 0, "2015-01-01"],
      [1, 3, "元旦节", 0, "2015-01-01"],
      [1, 4, "元旦节", 1, "2015-01-01"],
      [2, 15, "春节", 1, "2015-02-19"],
      [2, 18, "春节", 0, "2015-02-19"],
      [2, 19, "春节", 0, "2015-02-19"],
      [2, 20, "春节", 0, "2015-02-19"],
      [2, 21, "春节", 0, "2015-02-19"],
      [2, 22, "春节", 0, "2015-02-19"],
      [2, 23, "春节", 0, "2015-02-19"],
      [2, 24, "春节", 0, "2015-02-19"],
      [2, 28, "春节", 1, "2015-02-19"],
      [4, 4, "清明节", 0, "2015-04-05"],
      [4, 5, "清明节", 0, "2015-04-05"],
      [4, 6, "清明节", 0, "2015-04-05"],
      [5, 1, "劳动节", 0, "2015-05-01"],
      [5, 2, "劳动节", 0, "2015-05-01"],
      [5, 3, "劳动节", 0, "2015-05-01"],
      [6, 20, "端午节", 0, "2015-06-20"],
      [6, 21, "端午节", 0, "2015-06-20"],
      [6, 22, "端午节", 0, "2015-06-20"],
      [9, 3, "抗战胜利日", 0, "2015-09-03"],
      [9, 4, "抗战胜利日", 0, "2015-09-03"],
      [9, 5, "抗战胜利日", 0, "2015-09-03"],
      [9, 6, "抗战胜利日", 1, "2015-09-03"],
      [9, 26, "中秋节", 0, "2015-09-27"],
      [9, 27, "中秋节", 0, "2015-09-27"],
      [10, 1, "国庆节", 0, "2015-10-01"],
      [10, 2, "国庆节", 0, "2015-10-01"],
      [10, 3, "国庆节", 0, "2015-10-01"],
      [10, 4, "国庆节", 0, "2015-10-04"],
      [10, 5, "国庆节", 0, "2015-10-01"],
      [10, 6, "国庆节", 0, "2015-10-01"],
      [10, 7, "国庆节", 0, "2015-10-01"],
      [10, 10, "国庆节", 1, "2015-10-01"],
    ],
    2016: [
      [1, 1, "元旦节", 0, "2016-01-01"],
      [1, 2, "元旦节", 0, "2016-01-01"],
      [1, 3, "元旦节", 0, "2016-01-01"],
      [2, 6, "春节", 1, "2016-02-08"],
      [2, 7, "春节", 0, "2016-02-08"],
      [2, 8, "春节", 0, "2016-02-08"],
      [2, 9, "春节", 0, "2016-02-08"],
      [2, 10, "春节", 0, "2016-02-08"],
      [2, 11, "春节", 0, "2016-02-08"],
      [2, 12, "春节", 0, "2016-02-08"],
      [2, 13, "春节", 0, "2016-02-08"],
      [2, 14, "春节", 1, "2016-02-08"],
      [4, 2, "清明节", 0, "2016-04-04"],
      [4, 3, "清明节", 0, "2016-04-04"],
      [4, 4, "清明节", 0, "2016-04-04"],
      [4, 30, "劳动节", 0, "2016-05-01"],
      [5, 1, "劳动节", 0, "2016-05-01"],
      [5, 2, "劳动节", 0, "2016-05-01"],
      [6, 9, "端午节", 0, "2016-06-09"],
      [6, 10, "端午节", 0, "2016-06-09"],
      [6, 11, "端午节", 0, "2016-06-09"],
      [6, 12, "端午节", 1, "2016-06-09"],
      [9, 15, "中秋节", 0, "2016-09-15"],
      [9, 16, "中秋节", 0, "2016-09-15"],
      [9, 17, "中秋节", 0, "2016-09-15"],
      [9, 18, "中秋节", 1, "2016-09-15"],
      [10, 1, "国庆节", 0, "2016-10-01"],
      [10, 2, "国庆节", 0, "2016-10-01"],
      [10, 3, "国庆节", 0, "2016-10-01"],
      [10, 4, "国庆节", 0, "2016-10-01"],
      [10, 5, "国庆节", 0, "2016-10-01"],
      [10, 6, "国庆节", 0, "2016-10-01"],
      [10, 7, "国庆节", 0, "2016-10-01"],
      [10, 8, "国庆节", 1, "2016-10-01"],
      [10, 9, "国庆节", 1, "2016-10-01"],
      [12, 31, "元旦节", 0, "2017-01-01"],
    ],
    2017: [
      [1, 1, "元旦节", 0, "2017-01-01"],
      [1, 2, "元旦节", 0, "2017-01-01"],
      [1, 22, "春节", 1, "2017-01-28"],
      [1, 27, "春节", 0, "2017-01-28"],
      [1, 28, "春节", 0, "2017-01-28"],
      [1, 29, "春节", 0, "2017-01-28"],
      [1, 30, "春节", 0, "2017-01-28"],
      [1, 31, "春节", 0, "2017-01-28"],
      [2, 1, "春节", 0, "2017-01-28"],
      [2, 2, "春节", 0, "2017-01-28"],
      [2, 4, "春节", 1, "2017-01-28"],
      [4, 1, "清明节", 1, "2017-04-04"],
      [4, 2, "清明节", 0, "2017-04-04"],
      [4, 3, "清明节", 0, "2017-04-04"],
      [4, 4, "清明节", 0, "2017-04-04"],
      [4, 29, "劳动节", 0, "2017-05-01"],
      [4, 30, "劳动节", 0, "2017-05-01"],
      [5, 1, "劳动节", 0, "2017-05-01"],
      [5, 27, "端午节", 1, "2017-05-30"],
      [5, 28, "端午节", 0, "2017-05-30"],
      [5, 29, "端午节", 0, "2017-05-30"],
      [5, 30, "端午节", 0, "2017-05-30"],
      [9, 30, "国庆节", 1, "2017-10-01"],
      [10, 1, "国庆节", 0, "2017-10-01"],
      [10, 2, "国庆节", 0, "2017-10-01"],
      [10, 3, "国庆节", 0, "2017-10-01"],
      [10, 4, "中秋节", 0, "2017-10-04"],
      [10, 5, "国庆节", 0, "2017-10-01"],
      [10, 6, "国庆节", 0, "2017-10-01"],
      [10, 7, "国庆节", 0, "2017-10-01"],
      [10, 8, "国庆节", 0, "2017-10-01"],
      [12, 30, "元旦节", 0, "2018-01-01"],
      [12, 31, "元旦节", 0, "2018-01-01"],
    ],
    2018: [
      [1, 1, "元旦节", 0, "2018-01-01"],
      [2, 11, "春节", 1, "2018-02-16"],
      [2, 15, "春节", 0, "2018-02-16"],
      [2, 16, "春节", 0, "2018-02-16"],
      [2, 17, "春节", 0, "2018-02-16"],
      [2, 18, "春节", 0, "2018-02-16"],
      [2, 19, "春节", 0, "2018-02-16"],
      [2, 20, "春节", 0, "2018-02-16"],
      [2, 21, "春节", 0, "2018-02-16"],
      [2, 24, "春节", 1, "2018-02-16"],
      [4, 5, "清明节", 0, "2018-04-05"],
      [4, 6, "清明节", 0, "2018-04-05"],
      [4, 7, "清明节", 0, "2018-04-05"],
      [4, 8, "清明节", 1, "2018-04-05"],
      [4, 28, "劳动节", 1, "2018-05-01"],
      [4, 29, "劳动节", 0, "2018-05-01"],
      [4, 30, "劳动节", 0, "2018-05-01"],
      [5, 1, "劳动节", 0, "2018-05-01"],
      [6, 16, "端午节", 0, "2018-06-18"],
      [6, 17, "端午节", 0, "2018-06-18"],
      [6, 18, "端午节", 0, "2018-06-18"],
      [9, 22, "中秋节", 0, "2018-09-24"],
      [9, 23, "中秋节", 0, "2018-09-24"],
      [9, 24, "中秋节", 0, "2018-09-24"],
      [9, 29, "国庆节", 1, "2018-10-01"],
      [9, 30, "国庆节", 1, "2018-10-01"],
      [10, 1, "国庆节", 0, "2018-10-01"],
      [10, 2, "国庆节", 0, "2018-10-01"],
      [10, 3, "国庆节", 0, "2018-10-01"],
      [10, 4, "国庆节", 0, "2018-10-01"],
      [10, 5, "国庆节", 0, "2018-10-01"],
      [10, 6, "国庆节", 0, "2018-10-01"],
      [10, 7, "国庆节", 0, "2018-10-01"],
      [12, 29, "元旦节", 1, "2019-01-01"],
      [12, 30, "元旦节", 0, "2019-01-01"],
      [12, 31, "元旦节", 0, "2019-01-01"],
    ],
    2019: [
      [1, 1, "元旦节", 0, "2019-01-01"],
      [2, 2, "春节", 1, "2019-02-05"],
      [2, 3, "春节", 1, "2019-02-05"],
      [2, 4, "春节", 0, "2019-02-05"],
      [2, 5, "春节", 0, "2019-02-05"],
      [2, 6, "春节", 0, "2019-02-05"],
      [2, 7, "春节", 0, "2019-02-05"],
      [2, 8, "春节", 0, "2019-02-05"],
      [2, 9, "春节", 0, "2019-02-05"],
      [2, 10, "春节", 0, "2019-02-05"],
      [4, 5, "清明节", 0, "2019-04-05"],
      [4, 6, "清明节", 0, "2019-04-05"],
      [4, 7, "清明节", 0, "2019-04-05"],
      [4, 28, "劳动节", 1, "2019-05-01"],
      [5, 1, "劳动节", 0, "2019-05-01"],
      [5, 2, "劳动节", 0, "2019-05-01"],
      [5, 3, "劳动节", 0, "2019-05-01"],
      [5, 4, "劳动节", 0, "2019-05-01"],
      [5, 5, "劳动节", 1, "2019-05-01"],
      [6, 7, "端午节", 0, "2019-06-07"],
      [6, 8, "端午节", 0, "2019-06-07"],
      [6, 9, "端午节", 0, "2019-06-07"],
      [9, 13, "中秋节", 0, "2019-09-13"],
      [9, 14, "中秋节", 0, "2019-09-13"],
      [9, 15, "中秋节", 0, "2019-09-13"],
      [9, 29, "国庆节", 1, "2019-10-01"],
      [10, 1, "国庆节", 0, "2019-10-01"],
      [10, 2, "国庆节", 0, "2019-10-01"],
      [10, 3, "国庆节", 0, "2019-10-01"],
      [10, 4, "国庆节", 0, "2019-10-01"],
      [10, 5, "国庆节", 0, "2019-10-01"],
      [10, 6, "国庆节", 0, "2019-10-01"],
      [10, 7, "国庆节", 0, "2019-10-01"],
      [10, 12, "国庆节", 1, "2019-10-01"],
    ],
    2020: [
      [1, 1, "元旦节", 0, "2020-01-01"],
      [1, 19, "春节", 1, "2020-01-25"],
      [1, 24, "春节", 0, "2020-01-25"],
      [1, 25, "春节", 0, "2020-01-25"],
      [1, 26, "春节", 0, "2020-01-25"],
      [1, 27, "春节", 0, "2020-01-25"],
      [1, 28, "春节", 0, "2020-01-25"],
      [1, 29, "春节", 0, "2020-01-25"],
      [1, 30, "春节", 0, "2020-01-25"],
      [1, 31, "春节", 0, "2020-01-25"],
      [2, 1, "春节", 0, "2020-01-25"],
      [2, 2, "春节", 0, "2020-01-25"],
      [4, 4, "清明节", 0, "2020-04-04"],
      [4, 5, "清明节", 0, "2020-04-04"],
      [4, 6, "清明节", 0, "2020-04-04"],
      [4, 26, "劳动节", 1, "2020-05-01"],
      [5, 1, "劳动节", 0, "2020-05-01"],
      [5, 2, "劳动节", 0, "2020-05-01"],
      [5, 3, "劳动节", 0, "2020-05-01"],
      [5, 4, "劳动节", 0, "2020-05-01"],
      [5, 5, "劳动节", 0, "2020-05-01"],
      [5, 9, "劳动节", 1, "2020-05-01"],
      [6, 25, "端午节", 0, "2020-06-25"],
      [6, 26, "端午节", 0, "2020-06-25"],
      [6, 27, "端午节", 0, "2020-06-25"],
      [6, 28, "端午节", 1, "2020-06-25"],
      [9, 27, "国庆中秋", 1, "2020-10-01"],
      [10, 1, "国庆中秋", 0, "2020-10-01"],
      [10, 2, "国庆节", 0, "2020-10-01"],
      [10, 3, "国庆节", 0, "2020-10-01"],
      [10, 4, "国庆节", 0, "2020-10-01"],
      [10, 5, "国庆节", 0, "2020-10-01"],
      [10, 6, "国庆节", 0, "2020-10-01"],
      [10, 7, "国庆节", 0, "2020-10-01"],
      [10, 8, "国庆节", 0, "2020-10-01"],
      [10, 10, "国庆节", 1, "2020-10-01"],
    ],
    2021: [
      [1, 1, "元旦节", 0, "2021-01-01"],
      [1, 2, "元旦节", 0, "2021-01-01"],
      [1, 3, "元旦节", 0, "2021-01-01"],
      [2, 7, "春节", 1, "2021-02-12"],
      [2, 11, "春节", 0, "2021-02-12"],
      [2, 12, "春节", 0, "2021-02-12"],
      [2, 13, "春节", 0, "2021-02-12"],
      [2, 14, "春节", 0, "2021-02-12"],
      [2, 15, "春节", 0, "2021-02-12"],
      [2, 16, "春节", 0, "2021-02-12"],
      [2, 17, "春节", 0, "2021-02-12"],
      [2, 20, "春节", 1, "2021-02-12"],
      [4, 3, "清明节", 0, "2021-04-04"],
      [4, 4, "清明节", 0, "2021-04-04"],
      [4, 5, "清明节", 0, "2021-04-04"],
      [4, 25, "劳动节", 1, "2021-05-01"],
      [5, 1, "劳动节", 0, "2021-05-01"],
      [5, 2, "劳动节", 0, "2021-05-01"],
      [5, 3, "劳动节", 0, "2021-05-01"],
      [5, 4, "劳动节", 0, "2021-05-01"],
      [5, 5, "劳动节", 0, "2021-05-01"],
      [5, 8, "劳动节", 1, "2021-05-01"],
      [6, 12, "端午节", 0, "2021-06-14"],
      [6, 13, "端午节", 0, "2021-06-14"],
      [6, 14, "端午节", 0, "2021-06-14"],
      [9, 18, "中秋节", 1, "2021-09-21"],
      [9, 19, "中秋节", 0, "2021-09-21"],
      [9, 20, "中秋节", 0, "2021-09-21"],
      [9, 21, "中秋节", 0, "2021-09-21"],
      [9, 26, "国庆节", 1, "2021-10-01"],
      [10, 1, "国庆节", 0, "2021-10-01"],
      [10, 2, "国庆节", 0, "2021-10-01"],
      [10, 3, "国庆节", 0, "2021-10-01"],
      [10, 4, "国庆节", 0, "2021-10-01"],
      [10, 5, "国庆节", 0, "2021-10-01"],
      [10, 6, "国庆节", 0, "2021-10-01"],
      [10, 7, "国庆节", 0, "2021-10-01"],
      [10, 9, "国庆节", 1, "2021-10-01"],
    ],
    2022: [
      [1, 1, "元旦节", 0, "2022-01-01"],
      [1, 2, "元旦节", 0, "2022-01-01"],
      [1, 3, "元旦节", 0, "2022-01-01"],
      [1, 29, "春节", 1, "2022-02-01"],
      [1, 30, "春节", 1, "2022-02-01"],
      [1, 31, "春节", 0, "2022-02-01"],
      [2, 1, "春节", 0, "2022-02-01"],
      [2, 2, "春节", 0, "2022-02-01"],
      [2, 3, "春节", 0, "2022-02-01"],
      [2, 4, "春节", 0, "2022-02-01"],
      [2, 5, "春节", 0, "2022-02-01"],
      [2, 6, "春节", 0, "2022-02-01"],
      [4, 2, "清明节", 1, "2022-04-05"],
      [4, 3, "清明节", 0, "2022-04-05"],
      [4, 4, "清明节", 0, "2022-04-05"],
      [4, 5, "清明节", 0, "2022-04-05"],
      [4, 24, "劳动节", 1, "2022-05-01"],
      [4, 30, "劳动节", 0, "2022-05-01"],
      [5, 1, "劳动节", 0, "2022-05-01"],
      [5, 2, "劳动节", 0, "2022-05-01"],
      [5, 3, "劳动节", 0, "2022-05-01"],
      [5, 4, "劳动节", 0, "2022-05-01"],
      [5, 7, "劳动节", 1, "2022-05-01"],
      [6, 3, "端午节", 0, "2022-06-03"],
      [6, 4, "端午节", 0, "2022-06-03"],
      [6, 5, "端午节", 0, "2022-06-03"],
      [9, 10, "中秋节", 0, "2022-09-10"],
      [9, 11, "中秋节", 0, "2022-09-10"],
      [9, 12, "中秋节", 0, "2022-09-10"],
      [10, 1, "国庆节", 0, "2022-10-01"],
      [10, 2, "国庆节", 0, "2022-10-01"],
      [10, 3, "国庆节", 0, "2022-10-01"],
      [10, 4, "国庆节", 0, "2022-10-01"],
      [10, 5, "国庆节", 0, "2022-10-01"],
      [10, 6, "国庆节", 0, "2022-10-01"],
      [10, 7, "国庆节", 0, "2022-10-01"],
      [10, 8, "国庆节", 1, "2022-10-01"],
      [10, 9, "国庆节", 1, "2022-10-01"],
      [12, 31, "元旦节", 0, "2023-01-01"],
    ],
    2023: [
      [1, 1, "元旦节", 0, "2023-01-01"],
      [1, 2, "元旦节", 0, "2023-01-01"],
      [1, 21, "春节", 0, "2023-01-22"],
      [1, 22, "春节", 0, "2023-01-22"],
      [1, 23, "春节", 0, "2023-01-22"],
      [1, 24, "春节", 0, "2023-01-22"],
      [1, 25, "春节", 0, "2023-01-22"],
      [1, 26, "春节", 0, "2023-01-22"],
      [1, 27, "春节", 0, "2023-01-22"],
      [1, 28, "春节", 1, "2023-01-22"],
      [1, 29, "春节", 1, "2023-01-22"],
      [4, 5, "清明节", 0, "2023-04-05"],
      [4, 23, "劳动节", 1, "2023-05-01"],
      [4, 29, "劳动节", 0, "2023-05-01"],
      [4, 30, "劳动节", 0, "2023-05-01"],
      [5, 1, "劳动节", 0, "2023-05-01"],
      [5, 2, "劳动节", 0, "2023-05-01"],
      [5, 3, "劳动节", 0, "2023-05-01"],
      [5, 6, "劳动节", 1, "2023-05-01"],
      [6, 22, "端午节", 0, "2023-06-22"],
      [6, 23, "端午节", 0, "2023-06-22"],
      [6, 24, "端午节", 0, "2023-06-22"],
      [6, 25, "端午节", 1, "2023-06-22"],
      [9, 29, "中秋节", 0, "2023-09-29"],
      [9, 30, "国庆节", 0, "2023-10-01"],
      [10, 1, "国庆节", 0, "2023-10-01"],
      [10, 2, "国庆节", 0, "2023-10-01"],
      [10, 3, "国庆节", 0, "2023-10-01"],
      [10, 4, "国庆节", 0, "2023-10-01"],
      [10, 5, "国庆节", 0, "2023-10-01"],
      [10, 6, "国庆节", 0, "2023-10-01"],
      [10, 7, "国庆节", 1, "2023-10-01"],
      [10, 8, "国庆节", 1, "2023-10-01"],
      [12, 30, "元旦节", 0, "2024-01-01"],
      [12, 31, "元旦节", 0, "2024-01-01"],
    ],
    2024: [
      [1, 1, "元旦节", 0, "2024-01-01"],
      [2, 4, "春节", 1, "2024-02-10"],
      [2, 10, "春节", 0, "2024-02-10"],
      [2, 11, "春节", 0, "2024-02-10"],
      [2, 12, "春节", 0, "2024-02-10"],
      [2, 13, "春节", 0, "2024-02-10"],
      [2, 14, "春节", 0, "2024-02-10"],
      [2, 15, "春节", 0, "2024-02-10"],
      [2, 16, "春节", 0, "2024-02-10"],
      [2, 17, "春节", 0, "2024-02-10"],
      [2, 18, "春节", 1, "2024-02-10"],
      [4, 4, "清明节", 0, "2024-04-04"],
      [4, 5, "清明节", 0, "2024-04-04"],
      [4, 6, "清明节", 0, "2024-04-04"],
      [4, 7, "清明节", 1, "2024-04-04"],
      [4, 28, "劳动节", 1, "2024-05-01"],
      [5, 1, "劳动节", 0, "2024-05-01"],
      [5, 2, "劳动节", 0, "2024-05-01"],
      [5, 3, "劳动节", 0, "2024-05-01"],
      [5, 4, "劳动节", 0, "2024-05-01"],
      [5, 5, "劳动节", 0, "2024-05-01"],
      [5, 11, "劳动节", 1, "2024-05-01"],
      [6, 8, "端午节", 0, "2024-06-10"],
      [6, 9, "端午节", 0, "2024-06-10"],
      [6, 10, "端午节", 0, "2024-06-10"],
      [9, 14, "中秋节", 1, "2024-09-17"],
      [9, 15, "中秋节", 0, "2024-09-17"],
      [9, 16, "中秋节", 0, "2024-09-17"],
      [9, 17, "中秋节", 0, "2024-09-17"],
      [9, 29, "国庆节", 1, "2024-10-01"],
      [10, 1, "国庆节", 0, "2024-10-01"],
      [10, 2, "国庆节", 0, "2024-10-01"],
      [10, 3, "国庆节", 0, "2024-10-01"],
      [10, 4, "国庆节", 0, "2024-10-01"],
      [10, 5, "国庆节", 0, "2024-10-01"],
      [10, 6, "国庆节", 0, "2024-10-01"],
      [10, 7, "国庆节", 0, "2024-10-01"],
      [10, 12, "国庆节", 1, "2024-10-01"],
    ],
    2025: [
      [1, 1, "元旦节", 0, "2025-01-01"],
      [1, 26, "春节", 1, "2025-01-29"],
      [1, 28, "春节", 0, "2025-01-29"],
      [1, 29, "春节", 0, "2025-01-29"],
      [1, 30, "春节", 0, "2025-01-29"],
      [1, 31, "春节", 0, "2025-01-29"],
      [2, 1, "春节", 0, "2025-01-29"],
      [2, 2, "春节", 0, "2025-01-29"],
      [2, 3, "春节", 0, "2025-01-29"],
      [2, 4, "春节", 0, "2025-01-29"],
      [2, 8, "春节", 1, "2025-01-29"],
      [4, 4, "清明节", 0, "2025-04-04"],
      [4, 5, "清明节", 0, "2025-04-04"],
      [4, 6, "清明节", 0, "2025-04-04"],
      [4, 27, "劳动节", 1, "2025-05-01"],
      [5, 1, "劳动节", 0, "2025-05-01"],
      [5, 2, "劳动节", 0, "2025-05-01"],
      [5, 3, "劳动节", 0, "2025-05-01"],
      [5, 4, "劳动节", 0, "2025-05-01"],
      [5, 5, "劳动节", 0, "2025-05-01"],
      [5, 31, "端午节", 0, "2025-05-31"],
      [6, 1, "端午节", 0, "2025-05-31"],
      [6, 2, "端午节", 0, "2025-05-31"],
      [9, 28, "国庆中秋", 1, "2025-10-01"],
      [10, 1, "国庆中秋", 0, "2025-10-01"],
      [10, 2, "国庆中秋", 0, "2025-10-01"],
      [10, 3, "国庆中秋", 0, "2025-10-01"],
      [10, 4, "国庆中秋", 0, "2025-10-01"],
      [10, 5, "国庆中秋", 0, "2025-10-01"],
      [10, 6, "国庆中秋", 0, "2025-10-01"],
      [10, 7, "国庆中秋", 0, "2025-10-01"],
      [10, 8, "国庆中秋", 0, "2025-10-01"],
      [10, 11, "国庆中秋", 1, "2025-10-01"],
    ],
    2026: [
      [1, 1, "元旦节", 0, "2026-01-01"],
      [1, 2, "元旦节", 0, "2026-01-01"],
      [1, 3, "元旦节", 0, "2026-01-01"],
      [1, 4, "元旦节", 1, "2026-01-01"],
      [2, 14, "春节", 1, "2026-02-17"],
      [2, 15, "春节", 0, "2026-02-17"],
      [2, 16, "春节", 0, "2026-02-17"],
      [2, 17, "春节", 0, "2026-02-17"],
      [2, 18, "春节", 0, "2026-02-17"],
      [2, 19, "春节", 0, "2026-02-17"],
      [2, 20, "春节", 0, "2026-02-17"],
      [2, 21, "春节", 0, "2026-02-17"],
      [2, 22, "春节", 0, "2026-02-17"],
      [2, 23, "春节", 0, "2026-02-17"],
      [2, 28, "春节", 1, "2026-02-17"],
      [4, 4, "清明节", 0, "2026-04-05"],
      [4, 5, "清明节", 0, "2026-04-05"],
      [4, 6, "清明节", 0, "2026-04-05"],
      [5, 1, "劳动节", 0, "2026-05-01"],
      [5, 2, "劳动节", 0, "2026-05-01"],
      [5, 3, "劳动节", 0, "2026-05-01"],
      [5, 4, "劳动节", 0, "2026-05-01"],
      [5, 5, "劳动节", 0, "2026-05-01"],
      [5, 9, "劳动节", 1, "2026-05-01"],
      [6, 19, "端午节", 0, "2026-06-19"],
      [6, 20, "端午节", 0, "2026-06-19"],
      [6, 21, "端午节", 0, "2026-06-19"],
      [9, 20, "国庆节", 1, "2026-10-01"],
      [9, 25, "中秋节", 0, "2026-09-25"],
      [9, 26, "中秋节", 0, "2026-09-25"],
      [9, 27, "中秋节", 0, "2026-09-25"],
      [10, 1, "国庆节", 0, "2026-10-01"],
      [10, 2, "国庆节", 0, "2026-10-01"],
      [10, 3, "国庆节", 0, "2026-10-01"],
      [10, 4, "国庆节", 0, "2026-10-01"],
      [10, 5, "国庆节", 0, "2026-10-01"],
      [10, 6, "国庆节", 0, "2026-10-01"],
      [10, 7, "国庆节", 0, "2026-10-01"],
      [10, 10, "国庆节", 1, "2026-10-01"],
    ],
  },
  xi: ["艮", "乾", "坤", "离", "巽", "艮", "乾", "坤", "离", "巽"],
  fu: ["坎", "坤", "乾", "巽", "艮", "坎", "坤", "乾", "巽", "艮"],
  cai: ["艮", "艮", "坤", "坤", "坎", "坎", "震", "震", "离", "离"],
  yg: ["坤", "坤", "兑", "乾", "艮", "坎", "离", "艮", "震", "巽"],
  yin: ["艮", "坎", "乾", "兑", "坤", "坤", "艮", "离", "巽", "震"],
  tai: [
    "占门碓 外东南",
    "碓磨厕 外东南",
    "厨灶炉 外正南",
    "仓库门 外正南",
    "房床栖 外正南",
    "占门床 外正南",
    "占碓磨 外正南",
    "厨灶厕 外西南",
    "仓库炉 外西南",
    "房床门 外西南",
    "占门栖 外西南",
    "碓磨床 外西南",
    "厨灶碓 外西南",
    "仓库厕 外正西",
    "房床炉 外正西",
    "占大门 外正西",
    "碓磨栖 外正西",
    "厨灶床 外正西",
    "仓库碓 外西北",
    "房床厕 外西北",
    "占门炉 外西北",
    "碓磨门 外西北",
    "厨灶栖 外西北",
    "仓库床 外西北",
    "房床碓 外正北",
    "占门厕 外正北",
    "碓磨炉 外正北",
    "厨灶门 外正北",
    "仓库栖 外正北",
    "占房床 房内北",
    "占门碓 房内北",
    "碓磨厕 房内北",
    "厨灶炉 房内北",
    "仓库门 房内北",
    "房床栖 房内中",
    "占门床 房内中",
    "占碓磨 房内南",
    "厨灶厕 房内南",
    "仓库炉 房内南",
    "房床门 房内西",
    "占门栖 房内东",
    "碓磨床 房内东",
    "厨灶碓 房内东",
    "仓库厕 房内东",
    "房床炉 房内中",
    "占大门 外东北",
    "碓磨栖 外东北",
    "厨灶床 外东北",
    "仓库碓 外东北",
    "房床厕 外东北",
    "占门炉 外东北",
    "碓磨门 外正东",
    "厨灶栖 外正东",
    "仓库床 外正东",
    "房床碓 外正东",
    "占门厕 外正东",
    "碓磨炉 外东南",
    "厨灶门 外东南",
    "仓库栖 外东南",
    "占房床 外东南",
  ],
  pzg: [
    "甲不开仓财物耗散",
    "乙不栽植千株不长",
    "丙不修灶必见灾殃",
    "丁不剃头头必生疮",
    "戊不受田田主不祥",
    "己不破券二比并亡",
    "庚不经络织机虚张",
    "辛不合酱主人不尝",
    "壬不泱水更难提防",
    "癸不词讼理弱敌强",
  ],
  pzz: [
    "子不问卜自惹祸殃",
    "丑不冠带主不还乡",
    "寅不祭祀神鬼不尝",
    "卯不穿井水泉不香",
    "辰不哭泣必主重丧",
    "巳不远行财物伏藏",
    "午不苫盖屋主更张",
    "未不服药毒气入肠",
    "申不安床鬼祟入房",
    "酉不会客醉坐颠狂",
    "戌不吃犬作怪上床",
    "亥不嫁娶不利新郎",
  ],
};
const CAL_FOLK = [
  // [农历月,日,名称,地区/备注]
  [1, 5, "财神(路头)诞", "民间迎财神"],
  [1, 6, "清水祖师诞", "安溪清水岩一带"],
  [2, 2, "土地公(福德正神)诞", "民间通行"],
  [2, 3, "文昌帝君诞", "民间通行"],
  [2, 16, "开漳圣王(陈元光)诞", "漳州一带"],
  [2, 22, "广泽尊王诞", "泉州南安一带"],
  [3, 15, "保生大帝(吴夲)诞", "闽南、台湾"],
  [3, 23, "妈祖(天后)诞", "沿海通行"],
  [4, 14, "吕祖(吕洞宾)诞", "民间通行"],
  [6, 24, "关圣帝君诞", "闽南、台湾等地(另有说法)"],
  [7, 7, "魁星诞", "民间通行"],
  [8, 15, "太阴星君诞", "中秋"],
  [9, 9, "妈祖升天祭", "沿海通行"],
];
/* 民间神诞与道/佛教条目同名时不重复:取名称主干与括号内别名比对 */
function calFolkKeys(name) {
  const m = name.match(/^(.*?)\((.*?)\)(.*)$/);
  return m ? [m[1], m[2]].filter(Boolean) : [name.replace(/诞$/, "")];
}
function calFolkDup(lk, f) {
  const ks = calFolkKeys(f[2]),
    names = [...(CAL_DATA.tao[lk] || []).map((x) => x[0]), ...(CAL_DATA.foto[lk] || [])];
  return names.some((n) => ks.some((k) => k.length >= 2 && n.includes(k)));
}
const CAL_WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const CAL_LDAY = [
  "初一",
  "初二",
  "初三",
  "初四",
  "初五",
  "初六",
  "初七",
  "初八",
  "初九",
  "初十",
  "十一",
  "十二",
  "十三",
  "十四",
  "十五",
  "十六",
  "十七",
  "十八",
  "十九",
  "二十",
  "廿一",
  "廿二",
  "廿三",
  "廿四",
  "廿五",
  "廿六",
  "廿七",
  "廿八",
  "廿九",
  "三十",
];
const CAL_LMON = ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "冬", "腊"];
const CAL_DIR = {
  坎: "正北",
  艮: "东北",
  震: "正东",
  巽: "东南",
  离: "正南",
  坤: "西南",
  兑: "正西",
  乾: "西北",
};
const calLM = (m, leap) => (leap ? "闰" : "") + CAL_LMON[m - 1] + "月";
const calLD = (d) => CAL_LDAY[d - 1];
function calDim(y, m) {
  return [
    31,
    (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ][m - 1];
}
const calAddDays = (y, m, d, k) => {
  const f = fromJD(jdFromGreg(y, m, d, 12) + k);
  return { y: f.y, m: f.m, d: f.d };
};
const calWeekday = (y, m, d) => (((nwDayNum(y, m, d) + 1) % 7) + 7) % 7;
/* 农历→公历(按农历年缓存) */
const _calLmap = {};
function calLunarMap(ly) {
  if (_calLmap[ly]) return _calLmap[ly];
  const mp = {};
  let c = { y: ly, m: 1, d: 15 };
  for (let i = 0; i < 420; i++) {
    const l = solar2lunar(c.y, c.m, c.d);
    if (l.year === ly) mp[(l.isLeap ? "L" : "") + l.month + "-" + l.day] = [c.y, c.m, c.d];
    c = calAddDays(c.y, c.m, c.d, 1);
  }
  return (_calLmap[ly] = mp);
}
function calLunar2Solar(ly, lm, ld, leap) {
  const r = calLunarMap(ly)[(leap ? "L" : "") + lm + "-" + ld];
  return r ? { y: r[0], m: r[1], d: r[2] } : null;
}
/* 节气缓存 */
const _calTerm = {};
function calTerms(y) {
  return _calTerm[y] || (_calTerm[y] = nwSeasonYear(y));
}
function calTermOn(y, m, d) {
  const t = calTerms(y).find((t) => t.bj.m === m && t.bj.d === d);
  return t ? { name: t.name, zhong: t.zhong, time: f2(t.bj.h) + ":" + f2(t.bj.mi) } : null;
}
/* 月相(朔上弦望下弦) */
const _calPh = {};
function calPhases(y, m) {
  const k = y + "-" + m;
  if (_calPh[k]) return _calPh[k];
  const s = jdFromGreg(y, m, 1, 0) - 8 / 24,
    nx = calAddDays(y, m, calDim(y, m), 1),
    e = jdFromGreg(nx.y, nx.m, nx.d, 0) - 8 / 24,
    out = {};
  [
    [0, "朔"],
    [90, "上弦"],
    [180, "望"],
    [270, "下弦"],
  ].forEach(([tg, nm]) => {
    let t = nwNextPhase(s - 0.02, tg);
    while (t < e) {
      if (t >= s) {
        const f = fromJD(t + 8 / 24);
        out[f.d] = { name: nm, time: f2(f.h) + ":" + f2(f.mi) };
      }
      t = nwNextPhase(t + 5, tg);
    }
  });
  return (_calPh[k] = out);
}
function calMoonAt(y, m, d) {
  const el = nwElong(jdFromGreg(y, m, d, 12) - 8 / 24),
    lit = (1 - Math.cos(el * D2R)) / 2,
    i = Math.floor(((el + 22.5) % 360) / 45);
  return {
    el,
    lit,
    name: ["新月", "蛾眉月", "上弦月", "盈凸月", "满月", "亏凸月", "下弦月", "残月"][i],
  };
}
/* 节日 */
function calFest(y, m, d, di) {
  const D = CAL_DATA,
    lu = di.lunar,
    o = { solar: [], lunar: [], other: [], tao: [], foto: [], folk: [], so: [] },
    k = m + "-" + d;
  if (D.sf[k]) o.solar.push(D.sf[k]);
  (D.so[k] || []).forEach((x) => o.so.push(x));
  const n = Math.ceil(d / 7);
  [`${m}-${n}-${di.week}`]
    .concat(d + 7 > calDim(y, m) ? [`${m}-0-${di.week}`] : [])
    .forEach((kk) => {
      if (D.wk[kk]) o.solar.push(D.wk[kk]);
    });
  if (!lu.isLeap) {
    const lk = lu.month + "-" + lu.day;
    if (D.lf[lk]) o.lunar.push(D.lf[lk]);
    (D.lo[lk] || []).forEach((x) => o.other.push(x));
    (D.tao[lk] || []).forEach((x) => o.tao.push({ name: x[0], remark: x[1] }));
    (D.foto[lk] || []).forEach((x) => o.foto.push(x));
    CAL_FOLK.forEach((f) => {
      if (f[0] === lu.month && f[1] === lu.day && !calFolkDup(lk, f))
        o.folk.push({ name: f[2], remark: f[3] });
    });
    if (lu.month === 12) {
      const nx = calAddDays(y, m, d, 1),
        ln = solar2lunar(nx.y, nx.m, nx.d);
      if (ln.day === 1) o.lunar.push("除夕");
    }
  }
  {
    const nx = calAddDays(y, m, d, 1),
      tn = calTermOn(nx.y, nx.m, nx.d);
    if (tn && tn.name === "清明") o.other.push("寒食节");
  }
  {
    const dn = nwDayNum(y, m, d),
      sh = calShe(y);
    if (dn === sh.spring) o.other.push("春社");
    if (dn === sh.autumn) o.other.push("秋社");
  }
  {
    const tm = calTermOn(y, m, d);
    if (tm && tm.name === "冬至") o.tao.push({ name: "元始天尊圣诞", remark: "冬至" });
    if (tm && tm.name === "夏至") o.tao.push({ name: "灵宝天尊圣诞", remark: "夏至" });
  }
  return o;
}
function calHoliday(y, m, d) {
  const a = CAL_DATA.holidays[y];
  if (!a) return null;
  const h = a.find((x) => x[0] === m && x[1] === d);
  return h ? { name: h[2], work: !!h[3], target: h[4] } : null;
}
const calHolidayKnown = (y) => !!CAL_DATA.holidays[y];
/* 社日:立春后第五个戊日为春社,立秋后第五个戊日为秋社 */
const _calShe = {};
function calShe(y) {
  if (_calShe[y]) return _calShe[y];
  const f = (termName) => {
    const t = calTerms(y).find((x) => x.name === termName);
    let dn = nwDayNum(t.bj.y, t.bj.m, t.bj.d),
      c = 0;
    for (; ; dn++) {
      if (((((dn + 49) % 60) + 60) % 60) % 10 === 4) {
        c++;
        if (c === 5) return dn;
      }
    }
  };
  return (_calShe[y] = { spring: f("立春"), autumn: f("立秋") });
}
/* 生肖关系 */
function calZodiacRel(zi, db) {
  const t = [],
    d = (((db - zi) % 12) + 12) % 12,
    six = [
      [0, 1],
      [2, 11],
      [3, 10],
      [4, 9],
      [5, 8],
      [6, 7],
    ],
    tri = [
      [8, 0, 4],
      [2, 6, 10],
      [5, 9, 1],
      [11, 3, 7],
    ],
    hai = [
      [0, 7],
      [1, 6],
      [2, 5],
      [3, 4],
      [8, 11],
      [9, 10],
    ];
  if (d === 0) t.push("本命日(同支)");
  if (d === 6) t.push("相冲");
  if (six.some((p) => p.includes(zi) && p.includes(db) && zi !== db)) t.push("六合");
  if (tri.some((p) => p.includes(zi) && p.includes(db) && zi !== db)) t.push("三合");
  if (hai.some((p) => p.includes(zi) && p.includes(db) && zi !== db)) t.push("相害");
  return t;
}
/* 日全信息(供格子与详情) */
function calDay(y, m, d) {
  const di = dayInfo(y, m, d),
    lu = di.lunar,
    fest = calFest(y, m, d, di),
    hol = calHoliday(y, m, d),
    term = calTermOn(y, m, d),
    ph = calPhases(y, m)[d] || null;
  const gi = di.dayIdx,
    st = gi % 10,
    br = gi % 12,
    D = CAL_DATA;
  return Object.assign({}, di, {
    fest,
    hol,
    term,
    ph,
    week: di.week,
    lname: lu.day === 1 ? calLM(lu.month, lu.isLeap) : calLD(lu.day),
    lfull: `${calLM(lu.month, lu.isLeap)}${calLD(lu.day)}`,
    pos: { cai: D.cai[st], xi: D.xi[st], fu: D.fu[st], yg: D.yg[st], yin: D.yin[st] },
    tai: D.tai[gi],
    pz: D.pzg[st] + " " + D.pzz[br],
    dayZ: br,
    zodiac: ZODIAC12[(((lu.year - 4) % 12) + 12) % 12],
  });
}
/* 日期差 */
const calDiff = (a, b) => nwDayNum(b.y, b.m, b.d) - nwDayNum(a.y, a.m, a.d);
const calDayOfYear = (y, m, d) => nwDayNum(y, m, d) - nwDayNum(y, 1, 1) + 1;
/* 生成 iCalendar(全天事件) */
function calICS(y, opt) {
  const L = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tianjipan//calendar//CN",
    "CALSCALE:GREGORIAN",
    "X-WR-CALNAME:天机盘万年历 " + y,
    "X-WR-TIMEZONE:Asia/Shanghai",
  ];
  const ymd = (a) => `${a.y}${f2(a.m)}${f2(a.d)}`,
    stamp = "20260101T000000Z",
    esc = (s) =>
      String(s)
        .replace(/([,;\\])/g, "\\$1")
        .replace(/\n/g, "\\n");
  let n = 0;
  const add = (a, title, desc) => {
    if (!a) return;
    const nx = calAddDays(a.y, a.m, a.d, 1);
    L.push(
      "BEGIN:VEVENT",
      `UID:tj-${y}-${n++}-${ymd(a)}@tianjipan`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${ymd(a)}`,
      `DTEND;VALUE=DATE:${ymd(nx)}`,
      `SUMMARY:${esc(title)}`,
      desc ? `DESCRIPTION:${esc(desc)}` : "X-TJ:1",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
    );
  };
  if (opt.term)
    calTerms(y).forEach((t) =>
      add(
        { y: t.bj.y, m: t.bj.m, d: t.bj.d },
        t.name,
        `${t.name} ${f2(t.bj.h)}:${f2(t.bj.mi)}(北京时间)`,
      ),
    );
  const lunarSet = [];
  if (opt.fest) {
    Object.entries(CAL_DATA.lf).forEach(([k, v]) => lunarSet.push([k, v, "农历传统节日"]));
    lunarSet.push(["12-L", "除夕", "农历传统节日"]);
    Object.entries(CAL_DATA.lo).forEach(([k, v]) =>
      v.forEach((x) => lunarSet.push([k, x, "农历民俗节日"])),
    );
  }
  if (opt.deity) {
    Object.entries(CAL_DATA.tao).forEach(([k, v]) =>
      v.forEach((x) => {
        if (x[0].includes("诞")) lunarSet.push([k, x[0], "道教神诞" + (x[1] ? ":" + x[1] : "")]);
      }),
    );
    Object.entries(CAL_DATA.foto).forEach(([k, v]) =>
      v.forEach((x) => {
        if (x.includes("诞")) lunarSet.push([k, x, "佛教"]);
      }),
    );
    CAL_FOLK.forEach((f) => {
      if (!calFolkDup(f[0] + "-" + f[1], f))
        lunarSet.push([f[0] + "-" + f[1], f[2], "民间神诞(" + f[3] + ",各地说法不一)"]);
    });
  }
  lunarSet.forEach(([k, name, desc]) => {
    let a = null;
    if (k === "12-L") {
      const m = calLunarMap(y);
      for (const dd of [30, 29]) {
        if (m["12-" + dd]) {
          a = m["12-" + dd];
          break;
        }
      }
    } else {
      const [lm, ld] = k.split("-").map(Number);
      a = calLunar2Solar(y, lm, ld, false);
    }
    if (a)
      add(
        { y: a[0] ? a[0] : a.y, m: a[1] ? a[1] : a.m, d: a[2] ? a[2] : a.d },
        name,
        `${desc}(农历${k === "12-L" ? "腊月末日" : CAL_LMON[+k.split("-")[0] - 1] + "月" + calLD(+k.split("-")[1])})`,
      );
  });
  if (opt.solarFest) {
    Object.entries(CAL_DATA.sf).forEach(([k, v]) => {
      const [m, d] = k.split("-").map(Number);
      add({ y, m, d }, v, "公历节日");
    });
  }
  if (opt.holiday && calHolidayKnown(y))
    CAL_DATA.holidays[y].forEach((h) =>
      add(
        { y, m: h[0], d: h[1] },
        (h[3] ? "调休上班:" : "放假:") + h[2],
        "法定节假日安排(以国务院公布为准)",
      ),
    );
  L.push("END:VCALENDAR");
  return L.join("\r\n") + "\r\n";
}

/* =====================================================================
   择日联动:时辰评分(与日评分同一套机械加减,作用于当日十二时辰)
   ===================================================================== */
function zrHourScore(h, ev, birthZ) {
  let sc = h.huang ? 1 : -1;
  const why = [h.ts + (h.huang ? "(黄道)" : "(黑道)")];
  const hit = ev.yi.filter((x) => h.yi.includes(x)),
    bad = ev.ji.filter((x) => h.ji.includes(x));
  if (hit.length) {
    sc += Math.min(2, hit.length) * 1.2;
    why.push("时宜:" + hit.join("、"));
  }
  if (bad.length) {
    sc -= 3;
    why.push("时忌:" + bad.join("、"));
  }
  if (birthZ != null && birthZ >= 0 && h.chongZ === birthZ) {
    sc -= 3;
    why.push("冲本命生肖");
  }
  return { sc, why };
}
function zrBestHours(y, m, d, evName, birthZ) {
  const ev = ZERI_EVENTS[evName];
  return hoursOfDay(y, m, d)
    .map((h) => Object.assign({}, h, zrHourScore(h, ev, birthZ)))
    .sort((a, b) => b.sc - a.sc || a.b - b.b);
}

/* =====================================================================
   人物关系引擎:两两关系(五行生克、十神、日干合冲、日支/年支关系、用神扶持)与家庭整体分析、网络布局
   依据传统八字的常用口径;评分为机械加减,用于“倾向”而非断语
   ===================================================================== */
