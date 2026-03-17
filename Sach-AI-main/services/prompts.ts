/**
 * Multilingual forensic analysis prompts for SachAI.
 * Returns the full forensic analysis prompt in the requested language,
 * falling back to English for unsupported language codes.
 */

const PROMPTS: Record<string, string> = {

  /* ------------------------------------------------------------------ */
  en: `
[STEP 1: VULGARITY HARD-CHECK]
Scan all frames for:
- Anatomical exposure (nudity)
- Intimate physical contact (hugging, kissing)
- Sexualized behavior or gestures

If detected:
- Set "isExplicit" = true
- Set "verdict" = "Explicit Content"
- Set "integrityScore" = 0
- Generate a stern legal + ethical warning about consent, privacy, and misuse

CRITICAL RULES:
- NEVER state "Safe to Use" when isExplicit is true
- NEVER suspend analysis messaging

--------------------------------------------------

[STEP 2: ADVANCED FORENSIC DEEPFAKE AUDIT – 99% PRECISION]
Only if isExplicit = false, perform a multi-layer forensic scan:

A. IDENTITY & FACE CONSISTENCY
- Detect face swapping
- Facial landmark drift across frames
- Identity mismatch between frames

B. EYE & BLINK FORENSICS
- Abnormal blink frequency
- Asymmetrical blinking
- Iris reflection mismatch

C. LIP-SYNC & MOUTH PHYSICS (video)
- Mouth shape vs jaw motion inconsistency
- Melting or blurred teeth/lips
- Unrealistic phoneme transitions

D. SKIN & GAN ARTIFACTS
- Over-smoothed or plastic skin
- Checkerboard GAN patterns
- Unreal pore distribution

E. LIGHTING & SHADOW PHYSICS
- Inconsistent light direction
- Face vs background shadow mismatch
- Impossible highlights or reflections

F. TEMPORAL & GEOMETRIC STABILITY
- Sub-pixel jitter
- Warping in background lines
- Temporal morphing artifacts

G. CAMERA & OPTICAL VALIDATION
- Impossible depth of field
- Motion blur inconsistency
- Rolling shutter anomalies

--------------------------------------------------

[STEP 3: OSINT & CIRCULATION INTELLIGENCE (INFERENCE-BASED)]
Using ONLY visual evidence (no live internet access), infer:

- Where this media is MOST LIKELY circulated
- What TYPE of content it represents

Analyze:
- Aspect ratio
- Compression quality
- Watermarks
- Text overlays
- Framing & camera perspective
- Visual language

Infer:
- probableOrigin (short description)
- circulationChannels (platform types)
- contentTheme (primary category)
- osintConfidence (Low | Medium | High)

Use probabilistic language like "Likely", "Possibly", "High probability".
NEVER claim confirmed sources or specific websites.

--------------------------------------------------

[SCORING & VERDICT RULES]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

The integrityScore MUST be justified in explanation.

--------------------------------------------------

[OUTPUT REQUIREMENTS – STRICT]
Return ONLY valid JSON matching the provided schema.
DO NOT include markdown.
DO NOT include extra text.
Ensure all required fields are present.

If media is DEEPFAKE or SUSPICIOUS:
- Include realistic misuse risks
- Include harm mitigation advice

Accuracy and forensic rigor are critical.
`,

  /* ------------------------------------------------------------------ */
  hi: `
[चरण 1: अश्लीलता कठोर-जांच]
सभी फ्रेम्स को स्कैन करें:
- शारीरिक उजागर होना (नग्नता)
- अंतरंग शारीरिक संपर्क (गले लगाना, चुंबन)
- कामुक व्यवहार या इशारे

यदि पता चले:
- "isExplicit" = true सेट करें
- "verdict" = "Explicit Content" सेट करें
- "integrityScore" = 0 सेट करें
- सहमति, गोपनीयता और दुरुपयोग के बारे में एक कड़ी कानूनी + नैतिक चेतावनी उत्पन्न करें

महत्वपूर्ण नियम:
- जब isExplicit सत्य हो तब कभी "Safe to Use" न लिखें
- विश्लेषण संदेश कभी न रोकें

--------------------------------------------------

[चरण 2: उन्नत फोरेंसिक डीपफेक ऑडिट – 99% सटीकता]
केवल तब जब isExplicit = false हो, बहु-स्तरीय फोरेंसिक स्कैन करें:

A. पहचान और चेहरे की संगति
- फेस स्वैपिंग का पता लगाएं
- फ्रेम्स में चेहरे के लैंडमार्क का विचलन
- फ्रेम्स के बीच पहचान की असंगति

B. आंख और पलक का फोरेंसिक
- असामान्य पलक आवृत्ति
- असममित पलकें
- आईरिस प्रतिबिंब की असंगति

C. लिप-सिंक और मुंह भौतिकी (वीडियो)
- मुंह का आकार बनाम जबड़े की गति असंगति
- पिघलते या धुंधले दांत/होंठ
- अवास्तविक फोनेम संक्रमण

D. त्वचा और GAN कलाकृतियां
- अत्यधिक चिकनी या प्लास्टिक जैसी त्वचा
- चेकरबोर्ड GAN पैटर्न
- अवास्तविक छिद्र वितरण

E. प्रकाश और छाया भौतिकी
- असंगत प्रकाश दिशा
- चेहरे बनाम पृष्ठभूमि छाया की असंगति
- असंभव हाइलाइट्स या प्रतिबिंब

F. टेम्पोरल और ज्यामितीय स्थिरता
- सब-पिक्सेल जिटर
- पृष्ठभूमि रेखाओं में विकृति
- टेम्पोरल मॉर्फिंग कलाकृतियां

G. कैमरा और ऑप्टिकल सत्यापन
- असंभव गहराई का क्षेत्र
- मोशन ब्लर असंगति
- रोलिंग शटर विसंगतियां

--------------------------------------------------

[चरण 3: OSINT और प्रसार इंटेलिजेंस (अनुमान-आधारित)]
केवल दृश्य साक्ष्य का उपयोग करके (कोई लाइव इंटरनेट एक्सेस नहीं), अनुमान लगाएं:

- यह मीडिया सबसे अधिक कहां प्रसारित होने की संभावना है
- यह किस प्रकार की सामग्री का प्रतिनिधित्व करती है

विश्लेषण करें:
- पहलू अनुपात
- संपीड़न गुणवत्ता
- वॉटरमार्क
- टेक्स्ट ओवरले
- फ्रेमिंग और कैमरा परिप्रेक्ष्य
- दृश्य भाषा

अनुमान लगाएं:
- probableOrigin (संक्षिप्त विवरण)
- circulationChannels (प्लेटफ़ॉर्म प्रकार)
- contentTheme (प्राथमिक श्रेणी)
- osintConfidence (Low | Medium | High)

"संभवतः", "शायद", "उच्च संभावना" जैसी संभाव्य भाषा का प्रयोग करें।
कभी भी पुष्टिकृत स्रोत या विशिष्ट वेबसाइट का दावा न करें।

--------------------------------------------------

[स्कोरिंग और निर्णय नियम]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

integrityScore को explanation में उचित ठहराया जाना चाहिए।

--------------------------------------------------

[आउटपुट आवश्यकताएं – सख्त]
केवल प्रदान किए गए स्कीमा से मेल खाने वाला वैध JSON लौटाएं।
मार्कडाउन शामिल न करें।
अतिरिक्त टेक्स्ट शामिल न करें।
सुनिश्चित करें कि सभी आवश्यक फ़ील्ड मौजूद हैं।

यदि मीडिया DEEPFAKE या SUSPICIOUS है:
- वास्तविक दुरुपयोग जोखिम शामिल करें
- नुकसान शमन सलाह शामिल करें

सटीकता और फोरेंसिक कठोरता महत्वपूर्ण है।
`,

  /* ------------------------------------------------------------------ */
  es: `
[PASO 1: VERIFICACIÓN RIGUROSA DE VULGARIDAD]
Escanear todos los fotogramas en busca de:
- Exposición anatómica (desnudez)
- Contacto físico íntimo (abrazos, besos)
- Comportamiento o gestos sexualizados

Si se detecta:
- Establecer "isExplicit" = true
- Establecer "verdict" = "Explicit Content"
- Establecer "integrityScore" = 0
- Generar una advertencia legal y ética severa sobre consentimiento, privacidad y mal uso

REGLAS CRÍTICAS:
- NUNCA decir "Safe to Use" cuando isExplicit sea verdadero
- NUNCA suspender los mensajes de análisis

--------------------------------------------------

[PASO 2: AUDITORÍA FORENSE AVANZADA DE DEEPFAKE – 99% DE PRECISIÓN]
Solo si isExplicit = false, realizar un escaneo forense multicapa:

A. IDENTIDAD Y CONSISTENCIA FACIAL
- Detectar intercambio de rostros
- Deriva de puntos de referencia faciales entre fotogramas
- Discrepancia de identidad entre fotogramas

B. FORENSE DE OJOS Y PARPADEO
- Frecuencia de parpadeo anormal
- Parpadeo asimétrico
- Desajuste en el reflejo del iris

C. SINCRONIZACIÓN LABIAL Y FÍSICA DE LA BOCA (vídeo)
- Inconsistencia entre la forma de la boca y el movimiento de la mandíbula
- Dientes/labios derretidos o borrosos
- Transiciones de fonemas poco realistas

D. PIEL Y ARTEFACTOS GAN
- Piel demasiado suave o plástica
- Patrones GAN de tablero de ajedrez
- Distribución de poros irreal

E. FÍSICA DE ILUMINACIÓN Y SOMBRAS
- Dirección de luz inconsistente
- Discrepancia de sombra entre rostro y fondo
- Reflejos o destellos imposibles

F. ESTABILIDAD TEMPORAL Y GEOMÉTRICA
- Jitter de subpíxeles
- Distorsión en líneas de fondo
- Artefactos de morfing temporal

G. VALIDACIÓN ÓPTICA Y DE CÁMARA
- Profundidad de campo imposible
- Inconsistencia en el desenfoque de movimiento
- Anomalías de obturador rodante

--------------------------------------------------

[PASO 3: INTELIGENCIA OSINT Y DE CIRCULACIÓN (BASADA EN INFERENCIA)]
Usando SOLO evidencia visual (sin acceso a internet en vivo), inferir:

- Dónde es MÁS PROBABLE que circule este contenido
- Qué TIPO de contenido representa

Analizar:
- Relación de aspecto
- Calidad de compresión
- Marcas de agua
- Superposiciones de texto
- Encuadre y perspectiva de cámara
- Lenguaje visual

Inferir:
- probableOrigin (descripción breve)
- circulationChannels (tipos de plataforma)
- contentTheme (categoría principal)
- osintConfidence (Low | Medium | High)

Usar lenguaje probabilístico como "Probablemente", "Posiblemente", "Alta probabilidad".
NUNCA afirmar fuentes confirmadas o sitios web específicos.

--------------------------------------------------

[REGLAS DE PUNTUACIÓN Y VEREDICTO]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

El integrityScore DEBE estar justificado en la explicación.

--------------------------------------------------

[REQUISITOS DE SALIDA – ESTRICTOS]
Devolver SOLO JSON válido que coincida con el esquema proporcionado.
NO incluir markdown.
NO incluir texto adicional.
Asegurarse de que todos los campos requeridos estén presentes.

Si el contenido es DEEPFAKE o SUSPICIOUS:
- Incluir riesgos realistas de mal uso
- Incluir consejos de mitigación de daños

La precisión y el rigor forense son críticos.
`,

  /* ------------------------------------------------------------------ */
  fr: `
[ÉTAPE 1 : VÉRIFICATION STRICTE DE LA VULGARITÉ]
Analyser toutes les images à la recherche de :
- Exposition anatomique (nudité)
- Contact physique intime (câlins, baisers)
- Comportements ou gestes sexualisés

Si détecté :
- Définir "isExplicit" = true
- Définir "verdict" = "Explicit Content"
- Définir "integrityScore" = 0
- Générer un avertissement juridique et éthique sévère sur le consentement, la vie privée et l'utilisation abusive

RÈGLES CRITIQUES :
- Ne JAMAIS indiquer "Safe to Use" quand isExplicit est vrai
- Ne JAMAIS interrompre les messages d'analyse

--------------------------------------------------

[ÉTAPE 2 : AUDIT FORENSIQUE AVANCÉ DES DEEPFAKES – PRÉCISION À 99 %]
Uniquement si isExplicit = false, effectuer une analyse forensique multicouche :

A. IDENTITÉ ET COHÉRENCE DU VISAGE
- Détecter le remplacement de visage
- Dérive des points de repère faciaux entre les images
- Incompatibilité d'identité entre les images

B. FORENSIQUE DES YEUX ET DES CLIGNEMENTS
- Fréquence anormale de clignement
- Clignements asymétriques
- Discordance des reflets de l'iris

C. SYNCHRONISATION LABIALE ET PHYSIQUE DE LA BOUCHE (vidéo)
- Incohérence entre la forme de la bouche et le mouvement de la mâchoire
- Dents/lèvres fondantes ou floues
- Transitions de phonèmes peu réalistes

D. PEAU ET ARTEFACTS GAN
- Peau trop lisse ou aspect plastique
- Motifs GAN en damier
- Distribution de pores irréelle

E. PHYSIQUE DE L'ÉCLAIRAGE ET DES OMBRES
- Direction d'éclairage incohérente
- Discordance d'ombre entre le visage et l'arrière-plan
- Reflets ou éclairages impossibles

F. STABILITÉ TEMPORELLE ET GÉOMÉTRIQUE
- Gigue sous-pixel
- Déformation dans les lignes d'arrière-plan
- Artefacts de morphing temporel

G. VALIDATION OPTIQUE ET DE CAMÉRA
- Profondeur de champ impossible
- Incohérence du flou de mouvement
- Anomalies du volet d'obturation roulant

--------------------------------------------------

[ÉTAPE 3 : INTELLIGENCE OSINT ET DE CIRCULATION (BASÉE SUR L'INFÉRENCE)]
En utilisant UNIQUEMENT des preuves visuelles (sans accès Internet en direct), déduire :

- Où ce média est le PLUS SUSCEPTIBLE d'être diffusé
- Quel TYPE de contenu il représente

Analyser :
- Format d'image
- Qualité de compression
- Filigranes
- Superpositions de texte
- Cadrage et perspective de caméra
- Langage visuel

Déduire :
- probableOrigin (brève description)
- circulationChannels (types de plateformes)
- contentTheme (catégorie principale)
- osintConfidence (Low | Medium | High)

Utiliser un langage probabiliste comme "Probablement", "Peut-être", "Haute probabilité".
Ne JAMAIS affirmer des sources confirmées ou des sites web spécifiques.

--------------------------------------------------

[RÈGLES DE SCORE ET DE VERDICT]
- AUTHENTIC : integrityScore 90–100
- SUSPICIOUS : integrityScore 41–89
- DEEPFAKE : integrityScore 0–40

Le integrityScore DOIT être justifié dans l'explication.

--------------------------------------------------

[EXIGENCES DE SORTIE – STRICTES]
Retourner UNIQUEMENT du JSON valide correspondant au schéma fourni.
NE PAS inclure de markdown.
NE PAS inclure de texte supplémentaire.
S'assurer que tous les champs requis sont présents.

Si le média est DEEPFAKE ou SUSPICIOUS :
- Inclure les risques d'utilisation abusive réalistes
- Inclure des conseils d'atténuation des préjudices

La précision et la rigueur forensique sont essentielles.
`,

  /* ------------------------------------------------------------------ */
  de: `
[SCHRITT 1: HARTE PRÜFUNG AUF ANSTÖSSIGE INHALTE]
Alle Frames scannen auf:
- Anatomische Entblößung (Nacktheit)
- Intimer körperlicher Kontakt (Umarmungen, Küsse)
- Sexualisiertes Verhalten oder Gesten

Bei Erkennung:
- "isExplicit" = true setzen
- "verdict" = "Explicit Content" setzen
- "integrityScore" = 0 setzen
- Eine strenge rechtliche und ethische Warnung zu Einwilligung, Privatsphäre und Missbrauch erstellen

KRITISCHE REGELN:
- NIEMALS "Safe to Use" angeben, wenn isExplicit true ist
- Analyse-Nachrichten NIEMALS unterbrechen

--------------------------------------------------

[SCHRITT 2: ERWEITERTE FORENSISCHE DEEPFAKE-PRÜFUNG – 99 % PRÄZISION]
Nur wenn isExplicit = false, mehrschichtige forensische Analyse durchführen:

A. IDENTITÄT UND GESICHTSKONSISTENZ
- Face-Swapping erkennen
- Drift von Gesichtsmarkierungen zwischen Frames
- Identitätsdiskrepanz zwischen Frames

B. AUGEN- UND BLINZEL-FORENSIK
- Abnormale Blinzelfrequenz
- Asymmetrisches Blinzeln
- Iris-Reflexionsinkonsistenz

C. LIPPENSYNCHRONISATION UND MUNDPHYSIK (Video)
- Inkonsistenz zwischen Mundform und Kieferbewegung
- Schmelzende oder unscharfe Zähne/Lippen
- Unrealistische Phonemübergänge

D. HAUT UND GAN-ARTEFAKTE
- Übermäßig glatte oder plastische Haut
- Schachbrett-GAN-Muster
- Unreale Porenverteilung

E. BELEUCHTUNGS- UND SCHATTENPHYSIK
- Inkonsistente Lichtrichtung
- Diskrepanz zwischen Gesichts- und Hintergrundschatten
- Unmögliche Reflexionen oder Highlights

F. ZEITLICHE UND GEOMETRISCHE STABILITÄT
- Sub-Pixel-Jitter
- Verzerrungen in Hintergrundlinien
- Zeitliche Morphing-Artefakte

G. KAMERA- UND OPTISCHE VALIDIERUNG
- Unmögliche Tiefenschärfe
- Inkonsistenz beim Bewegungsunschärfe
- Rolling-Shutter-Anomalien

--------------------------------------------------

[SCHRITT 3: OSINT- UND VERBREITUNGSNACHRICHTENDIENST (INFERENZBASIERT)]
Nur anhand visueller Beweise (kein Live-Internet-Zugang), ableiten:

- Wo dieses Medium am WAHRSCHEINLICHSTEN verbreitet wird
- Welchen TYP von Inhalt es darstellt

Analysieren:
- Seitenverhältnis
- Komprimierungsqualität
- Wasserzeichen
- Textüberlagerungen
- Bildausschnitt und Kameraperspektive
- Visuelle Sprache

Ableiten:
- probableOrigin (kurze Beschreibung)
- circulationChannels (Plattformtypen)
- contentTheme (Hauptkategorie)
- osintConfidence (Low | Medium | High)

Probabilistische Sprache verwenden wie "Wahrscheinlich", "Möglicherweise", "Hohe Wahrscheinlichkeit".
NIEMALS bestätigte Quellen oder spezifische Websites behaupten.

--------------------------------------------------

[BEWERTUNGS- UND URTEILSREGELN]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

Der integrityScore MUSS in der Erklärung begründet werden.

--------------------------------------------------

[AUSGABEANFORDERUNGEN – STRENG]
Nur gültiges JSON zurückgeben, das dem bereitgestellten Schema entspricht.
KEIN Markdown einschließen.
KEINEN zusätzlichen Text einschließen.
Sicherstellen, dass alle erforderlichen Felder vorhanden sind.

Wenn das Medium DEEPFAKE oder SUSPICIOUS ist:
- Realistische Missbrauchsrisiken einschließen
- Empfehlungen zur Schadensminimierung einschließen

Genauigkeit und forensische Strenge sind entscheidend.
`,

  /* ------------------------------------------------------------------ */
  zh: `
[步骤 1：粗俗内容严格检查]
扫描所有帧，查找：
- 解剖学暴露（裸体）
- 亲密肢体接触（拥抱、接吻）
- 性化行为或姿势

若检测到：
- 将 "isExplicit" 设置为 true
- 将 "verdict" 设置为 "Explicit Content"
- 将 "integrityScore" 设置为 0
- 生成关于同意、隐私和滥用的严正法律及道德警告

关键规则：
- 当 isExplicit 为 true 时，绝不声明 "Safe to Use"
- 绝不暂停分析消息

--------------------------------------------------

[步骤 2：高级法证深度伪造审计 — 99% 精确度]
仅当 isExplicit = false 时，执行多层法证扫描：

A. 身份与面部一致性
- 检测人脸替换
- 帧间面部特征点漂移
- 帧间身份不匹配

B. 眼睛与眨眼法证
- 异常眨眼频率
- 不对称眨眼
- 虹膜反射不一致

C. 唇形同步与嘴部物理特性（视频）
- 嘴形与下颌运动不一致
- 牙齿/嘴唇融化或模糊
- 不真实的音素过渡

D. 皮肤与 GAN 伪影
- 过度光滑或塑料感皮肤
- 棋盘格 GAN 模式
- 不真实的毛孔分布

E. 光照与阴影物理特性
- 光线方向不一致
- 面部与背景阴影不匹配
- 不可能的高光或反射

F. 时间与几何稳定性
- 亚像素抖动
- 背景线条变形
- 时间变形伪影

G. 相机与光学验证
- 不可能的景深
- 运动模糊不一致
- 卷帘快门异常

--------------------------------------------------

[步骤 3：OSINT 与传播情报（基于推断）]
仅使用视觉证据（无实时网络访问），推断：

- 该媒体最可能在哪里传播
- 它代表哪种类型的内容

分析：
- 宽高比
- 压缩质量
- 水印
- 文字叠加
- 取景与相机角度
- 视觉语言

推断：
- probableOrigin（简短描述）
- circulationChannels（平台类型）
- contentTheme（主要类别）
- osintConfidence（Low | Medium | High）

使用概率性语言，如"可能"、"或许"、"高概率"。
绝不声称已确认的来源或特定网站。

--------------------------------------------------

[评分与裁决规则]
- AUTHENTIC：integrityScore 90–100
- SUSPICIOUS：integrityScore 41–89
- DEEPFAKE：integrityScore 0–40

integrityScore 必须在 explanation 中给出依据。

--------------------------------------------------

[输出要求 — 严格]
仅返回符合所提供模式的有效 JSON。
不包含 Markdown。
不包含额外文本。
确保所有必填字段均已填写。

如果媒体为 DEEPFAKE 或 SUSPICIOUS：
- 包含真实的滥用风险
- 包含损害缓解建议

准确性与法证严谨性至关重要。
`,

  /* ------------------------------------------------------------------ */
  ja: `
[ステップ 1：わいせつコンテンツの厳格チェック]
すべてのフレームを以下の項目でスキャンしてください：
- 解剖学的な露出（ヌード）
- 親密な身体接触（抱擁、キス）
- 性的な行為やジェスチャー

検出された場合：
- "isExplicit" = true に設定
- "verdict" = "Explicit Content" に設定
- "integrityScore" = 0 に設定
- 同意・プライバシー・悪用に関する厳格な法的・倫理的警告を生成する

重要ルール：
- isExplicit が true の場合、「Safe to Use」と絶対に表示しないこと
- 分析メッセージを絶対に中断しないこと

--------------------------------------------------

[ステップ 2：高度な法医学的ディープフェイク監査 — 精度 99%]
isExplicit = false の場合のみ、多層法医学スキャンを実行してください：

A. 同一性と顔の一貫性
- フェイススワッピングの検出
- フレーム間での顔のランドマークのドリフト
- フレーム間での同一性の不一致

B. 目と瞬きの法医学
- 異常な瞬き頻度
- 非対称な瞬き
- 虹彩反射の不一致

C. リップシンクと口の物理（動画）
- 口の形とあごの動きの不一致
- 歯/唇の溶融またはぼかし
- 非現実的な音素遷移

D. 肌と GAN アーティファクト
- 過度に滑らかまたはプラスチックのような肌
- チェッカーボード GAN パターン
- 非現実的な毛穴の分布

E. 照明と影の物理
- 不一致な光の方向
- 顔と背景の影の不一致
- あり得ないハイライトや反射

F. 時間的・幾何学的安定性
- サブピクセルのジッター
- 背景線の歪み
- 時間的モーフィングアーティファクト

G. カメラと光学の検証
- あり得ない被写界深度
- モーションブラーの不一致
- ローリングシャッターの異常

--------------------------------------------------

[ステップ 3：OSINT と流通インテリジェンス（推論ベース）]
視覚的証拠のみを使用して（ライブインターネットアクセスなし）、以下を推論してください：

- このメディアが最も可能性の高い流通先
- どのタイプのコンテンツを表しているか

分析対象：
- アスペクト比
- 圧縮品質
- ウォーターマーク
- テキストオーバーレイ
- フレーミングとカメラ視点
- ビジュアル言語

推論：
- probableOrigin（簡潔な説明）
- circulationChannels（プラットフォームの種類）
- contentTheme（主要カテゴリ）
- osintConfidence（Low | Medium | High）

「おそらく」「可能性あり」「高い確率で」などの確率的な言語を使用してください。
確認済みの情報源や特定のウェブサイトを主張しないこと。

--------------------------------------------------

[スコアリングと判定ルール]
- AUTHENTIC：integrityScore 90–100
- SUSPICIOUS：integrityScore 41–89
- DEEPFAKE：integrityScore 0–40

integrityScore は explanation で根拠を示すこと。

--------------------------------------------------

[出力要件 — 厳格]
提供されたスキーマに一致する有効な JSON のみを返してください。
Markdown を含めないこと。
余分なテキストを含めないこと。
すべての必須フィールドが存在することを確認してください。

メディアが DEEPFAKE または SUSPICIOUS の場合：
- 現実的な悪用リスクを含める
- 被害軽減アドバイスを含める

精度と法医学的厳格さが重要です。
`,

  /* ------------------------------------------------------------------ */
  pt: `
[PASSO 1: VERIFICAÇÃO RIGOROSA DE VULGARIDADE]
Analisar todos os quadros em busca de:
- Exposição anatômica (nudez)
- Contato físico íntimo (abraços, beijos)
- Comportamentos ou gestos sexualizados

Se detectado:
- Definir "isExplicit" = true
- Definir "verdict" = "Explicit Content"
- Definir "integrityScore" = 0
- Gerar um aviso jurídico e ético severo sobre consentimento, privacidade e uso indevido

REGRAS CRÍTICAS:
- NUNCA afirmar "Safe to Use" quando isExplicit for verdadeiro
- NUNCA suspender as mensagens de análise

--------------------------------------------------

[PASSO 2: AUDITORIA FORENSE AVANÇADA DE DEEPFAKE – 99% DE PRECISÃO]
Somente se isExplicit = false, realizar uma varredura forense multicamada:

A. IDENTIDADE E CONSISTÊNCIA FACIAL
- Detectar troca de rosto
- Deriva de pontos de referência faciais entre quadros
- Incompatibilidade de identidade entre quadros

B. FORENSE DE OLHOS E PISCADAS
- Frequência anormal de piscadas
- Piscadas assimétricas
- Incompatibilidade de reflexo da íris

C. SINCRONIZAÇÃO LABIAL E FÍSICA DA BOCA (vídeo)
- Inconsistência entre a forma da boca e o movimento da mandíbula
- Dentes/lábios derretidos ou borrados
- Transições de fonemas irrealistas

D. PELE E ARTEFATOS GAN
- Pele excessivamente suave ou plástica
- Padrões GAN em xadrez
- Distribuição de poros irreal

E. FÍSICA DE ILUMINAÇÃO E SOMBRAS
- Direção de luz inconsistente
- Incompatibilidade de sombra entre rosto e fundo
- Reflexos ou destaques impossíveis

F. ESTABILIDADE TEMPORAL E GEOMÉTRICA
- Jitter de subpixels
- Distorção em linhas de fundo
- Artefatos de morphing temporal

G. VALIDAÇÃO ÓPTICA E DE CÂMERA
- Profundidade de campo impossível
- Inconsistência no desfoque de movimento
- Anomalias de obturador deslizante

--------------------------------------------------

[PASSO 3: INTELIGÊNCIA OSINT E DE CIRCULAÇÃO (BASEADA EM INFERÊNCIA)]
Usando APENAS evidências visuais (sem acesso à internet em tempo real), inferir:

- Onde este mídia é MAIS PROVÁVEL de circular
- Que TIPO de conteúdo representa

Analisar:
- Proporção de aspecto
- Qualidade de compressão
- Marcas d'água
- Sobreposições de texto
- Enquadramento e perspectiva de câmera
- Linguagem visual

Inferir:
- probableOrigin (descrição breve)
- circulationChannels (tipos de plataforma)
- contentTheme (categoria principal)
- osintConfidence (Low | Medium | High)

Usar linguagem probabilística como "Provavelmente", "Possivelmente", "Alta probabilidade".
NUNCA afirmar fontes confirmadas ou sites específicos.

--------------------------------------------------

[REGRAS DE PONTUAÇÃO E VEREDICTO]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

O integrityScore DEVE ser justificado na explicação.

--------------------------------------------------

[REQUISITOS DE SAÍDA – ESTRITOS]
Retornar APENAS JSON válido que corresponda ao esquema fornecido.
NÃO incluir markdown.
NÃO incluir texto adicional.
Garantir que todos os campos obrigatórios estejam presentes.

Se o mídia for DEEPFAKE ou SUSPICIOUS:
- Incluir riscos realistas de uso indevido
- Incluir conselhos de mitigação de danos

A precisão e o rigor forense são fundamentais.
`,

  /* ------------------------------------------------------------------ */
  ru: `
[ШАГ 1: ЖЁСТКАЯ ПРОВЕРКА НА ВУЛЬГАРНОСТЬ]
Сканировать все кадры на наличие:
- Анатомической обнажённости (нагота)
- Интимного физического контакта (объятия, поцелуи)
- Сексуализированного поведения или жестов

При обнаружении:
- Установить "isExplicit" = true
- Установить "verdict" = "Explicit Content"
- Установить "integrityScore" = 0
- Сгенерировать строгое юридическое и этическое предупреждение о согласии, конфиденциальности и злоупотреблении

КРИТИЧЕСКИЕ ПРАВИЛА:
- НИКОГДА не указывать "Safe to Use", когда isExplicit равно true
- НИКОГДА не прерывать сообщения анализа

--------------------------------------------------

[ШАГ 2: РАСШИРЕННЫЙ СУДЕБНО-МЕДИЦИНСКИЙ АУДИТ ДИПФЕЙКОВ — ТОЧНОСТЬ 99%]
Только если isExplicit = false, выполнить многоуровневое судебно-медицинское сканирование:

А. ИДЕНТИЧНОСТЬ И СОГЛАСОВАННОСТЬ ЛИЦА
- Обнаружить замену лица
- Смещение лицевых ориентиров между кадрами
- Несоответствие личности между кадрами

Б. СУДЕБНАЯ ЭКСПЕРТИЗА ГЛАЗ И МОРГАНИЯ
- Ненормальная частота моргания
- Асимметричное моргание
- Несоответствие отражений радужной оболочки

В. СИНХРОНИЗАЦИЯ ГУБ И ФИЗИКА РТА (видео)
- Несоответствие формы рта и движения челюсти
- Размытые или «расплавленные» зубы/губы
- Нереалистичные переходы фонем

Г. КОЖА И АРТЕФАКТЫ GAN
- Чрезмерно гладкая или пластиковая кожа
- Шахматные паттерны GAN
- Нереальное распределение пор

Д. ФИЗИКА ОСВЕЩЕНИЯ И ТЕНЕЙ
- Непоследовательное направление света
- Несоответствие тени лица и фона
- Невозможные блики или отражения

Е. ВРЕМЕННАЯ И ГЕОМЕТРИЧЕСКАЯ СТАБИЛЬНОСТЬ
- Субпиксельный джиттер
- Искажения в фоновых линиях
- Артефакты временного морфинга

Ж. ПРОВЕРКА КАМЕРЫ И ОПТИКИ
- Невозможная глубина резкости
- Несоответствие размытия движения
- Аномалии скользящего затвора

--------------------------------------------------

[ШАГ 3: OSINT И РАЗВЕДКА РАСПРОСТРАНЕНИЯ (НА ОСНОВЕ ВЫВОДА)]
Используя ТОЛЬКО визуальные свидетельства (без прямого доступа к интернету), сделать вывод:

- Где этот медиафайл СКОРЕЕ ВСЕГО распространяется
- Какой ТИП контента он представляет

Анализировать:
- Соотношение сторон
- Качество сжатия
- Водяные знаки
- Текстовые наложения
- Кадрирование и перспектива камеры
- Визуальный язык

Вывести:
- probableOrigin (краткое описание)
- circulationChannels (типы платформ)
- contentTheme (основная категория)
- osintConfidence (Low | Medium | High)

Использовать вероятностный язык, например «Вероятно», «Возможно», «Высокая вероятность».
НИКОГДА не заявлять о подтверждённых источниках или конкретных веб-сайтах.

--------------------------------------------------

[ПРАВИЛА ОЦЕНКИ И ВЕРДИКТА]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

integrityScore ДОЛЖЕН быть обоснован в explanation.

--------------------------------------------------

[ТРЕБОВАНИЯ К ВЫВОДУ — СТРОГИЕ]
Возвращать ТОЛЬКО допустимый JSON, соответствующий предоставленной схеме.
НЕ включать markdown.
НЕ включать дополнительный текст.
Убедиться, что все обязательные поля присутствуют.

Если медиафайл является DEEPFAKE или SUSPICIOUS:
- Включить реалистичные риски злоупотребления
- Включить рекомендации по снижению вреда

Точность и судебно-медицинская строгость критически важны.
`,

  /* ------------------------------------------------------------------ */
  ar: `
[الخطوة 1: فحص صارم للمحتوى الفاحش]
فحص جميع الإطارات بحثاً عن:
- التعري التشريحي (العري)
- الاتصال الجسدي الحميمي (الأحضان، القبلات)
- السلوك أو الإيماءات الجنسية

إذا تم اكتشافه:
- تعيين "isExplicit" = true
- تعيين "verdict" = "Explicit Content"
- تعيين "integrityScore" = 0
- إنشاء تحذير قانوني وأخلاقي صارم بشأن الموافقة والخصوصية وإساءة الاستخدام

القواعد الحاسمة:
- لا تذكر أبداً "Safe to Use" عندما تكون isExplicit صحيحة
- لا توقف أبداً رسائل التحليل

--------------------------------------------------

[الخطوة 2: تدقيق جنائي متقدم للتزوير العميق — دقة 99%]
فقط إذا كانت isExplicit = false، قم بإجراء فحص جنائي متعدد الطبقات:

أ. الهوية واتساق الوجه
- اكتشاف تبديل الوجه
- انجراف نقاط مرجعية الوجه عبر الإطارات
- عدم تطابق الهوية بين الإطارات

ب. الجنائيات العينية والرمشية
- تردد وميض غير طبيعي
- رمش غير متماثل
- عدم تطابق انعكاسات القزحية

ج. مزامنة الشفاه وفيزياء الفم (فيديو)
- عدم اتساق شكل الفم مع حركة الفك
- ذوبان أو ضبابية الأسنان/الشفاه
- انتقالات صوتية غير واقعية

د. الجلد وآثار GAN
- جلد ناعم بشكل مفرط أو يشبه البلاستيك
- أنماط GAN على شكل رقعة الشطرنج
- توزيع المسام غير الواقعي

هـ. فيزياء الإضاءة والظلال
- اتجاه ضوء غير متسق
- عدم تطابق الظل بين الوجه والخلفية
- انعكاسات أو إضاءات مستحيلة

و. الاستقرار الزمني والهندسي
- ارتعاش دون البكسل
- تشوه في خطوط الخلفية
- آثار التشكيل الزمني

ز. التحقق البصري والكاميرا
- عمق مجال مستحيل
- عدم اتساق ضبابية الحركة
- شذوذات الغالق المتدحرج

--------------------------------------------------

[الخطوة 3: استخبارات OSINT والتداول (قائمة على الاستنتاج)]
باستخدام الأدلة البصرية فقط (بدون وصول مباشر للإنترنت)، استنتج:

- أين يُرجَّح أن يتداول هذا الوسيط
- ما نوع المحتوى الذي يمثله

تحليل:
- نسبة العرض إلى الارتفاع
- جودة الضغط
- العلامات المائية
- تراكب النصوص
- التأطير ومنظور الكاميرا
- اللغة البصرية

استنتج:
- probableOrigin (وصف موجز)
- circulationChannels (أنواع المنصات)
- contentTheme (الفئة الرئيسية)
- osintConfidence (Low | Medium | High)

استخدم لغة احتمالية مثل "على الأرجح"، "ربما"، "احتمالية عالية".
لا تدّعِ أبداً مصادر مؤكدة أو مواقع ويب محددة.

--------------------------------------------------

[قواعد التسجيل والحكم]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

يجب تبرير integrityScore في explanation.

--------------------------------------------------

[متطلبات المخرجات — صارمة]
أعد فقط JSON صالحاً يطابق المخطط المقدم.
لا تضمّن markdown.
لا تضمّن نصاً إضافياً.
تأكد من وجود جميع الحقول المطلوبة.

إذا كان الوسيط DEEPFAKE أو SUSPICIOUS:
- أضف مخاطر إساءة الاستخدام الواقعية
- أضف نصائح للتخفيف من الضرر

الدقة والصرامة الجنائية أمران بالغا الأهمية.
`,

  /* ------------------------------------------------------------------ */
  ko: `
[단계 1: 저속성 엄격 확인]
모든 프레임을 다음 항목으로 스캔하세요:
- 해부학적 노출 (나체)
- 친밀한 신체 접촉 (포옹, 키스)
- 성적인 행동 또는 제스처

감지된 경우:
- "isExplicit" = true 설정
- "verdict" = "Explicit Content" 설정
- "integrityScore" = 0 설정
- 동의, 프라이버시, 오용에 관한 엄중한 법적·윤리적 경고 생성

핵심 규칙:
- isExplicit이 true인 경우 "Safe to Use"라고 절대 표시하지 마세요
- 분석 메시지를 절대 중단하지 마세요

--------------------------------------------------

[단계 2: 고급 법의학 딥페이크 감사 — 99% 정확도]
isExplicit = false인 경우에만 다층 법의학 스캔을 수행하세요:

A. 신원 및 얼굴 일관성
- 얼굴 교체 감지
- 프레임 간 얼굴 랜드마크 이동
- 프레임 간 신원 불일치

B. 눈 및 깜박임 법의학
- 비정상적인 깜박임 빈도
- 비대칭 깜박임
- 홍채 반사 불일치

C. 립싱크 및 입 물리학 (동영상)
- 입 모양과 턱 움직임의 불일치
- 녹아내리거나 흐릿한 치아/입술
- 비현실적인 음소 전환

D. 피부 및 GAN 아티팩트
- 지나치게 매끄럽거나 플라스틱 같은 피부
- 체크보드 GAN 패턴
- 비현실적인 모공 분포

E. 조명 및 그림자 물리학
- 일관성 없는 빛의 방향
- 얼굴과 배경 그림자 불일치
- 불가능한 하이라이트 또는 반사

F. 시간적·기하학적 안정성
- 서브픽셀 지터
- 배경 라인의 왜곡
- 시간적 모핑 아티팩트

G. 카메라 및 광학 검증
- 불가능한 피사계 심도
- 모션 블러 불일치
- 롤링 셔터 이상

--------------------------------------------------

[단계 3: OSINT 및 유통 인텔리전스 (추론 기반)]
시각적 증거만 사용하여 (실시간 인터넷 접근 없음), 다음을 추론하세요:

- 이 미디어가 유통될 가능성이 가장 높은 곳
- 어떤 유형의 콘텐츠를 나타내는지

분석:
- 화면 비율
- 압축 품질
- 워터마크
- 텍스트 오버레이
- 프레이밍 및 카메라 관점
- 시각적 언어

추론:
- probableOrigin (간단한 설명)
- circulationChannels (플랫폼 유형)
- contentTheme (주요 카테고리)
- osintConfidence (Low | Medium | High)

"아마도", "가능성 있음", "높은 확률" 등의 확률적 언어를 사용하세요.
확인된 출처나 특정 웹사이트를 절대 주장하지 마세요.

--------------------------------------------------

[점수 및 판정 규칙]
- AUTHENTIC: integrityScore 90–100
- SUSPICIOUS: integrityScore 41–89
- DEEPFAKE: integrityScore 0–40

integrityScore는 explanation에서 근거를 제시해야 합니다.

--------------------------------------------------

[출력 요건 — 엄격]
제공된 스키마와 일치하는 유효한 JSON만 반환하세요.
Markdown을 포함하지 마세요.
추가 텍스트를 포함하지 마세요.
모든 필수 필드가 존재하는지 확인하세요.

미디어가 DEEPFAKE 또는 SUSPICIOUS인 경우:
- 현실적인 오용 위험 포함
- 피해 완화 조언 포함

정확성과 법의학적 엄격성이 중요합니다.
`,

};

/**
 * Returns the forensic analysis prompt for the given language code.
 * Falls back to English if the language is not supported.
 */
export const getForensicPrompt = (language: string): string => {
  return PROMPTS[language] ?? PROMPTS['en'];
};
