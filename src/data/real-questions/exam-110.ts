// 第110回薬剤師国家試験 実問題データ
// 出典: 厚生労働省 + yakugakulab.info
// PDFテキスト + 正答JSON + Web解説 を統合

import type { Question } from '../../types/question'

export const EXAM_110_QUESTIONS: Question[] = [
  {
    "id": "r110-001",
    "year": 110,
    "question_number": 1,
    "section": "必須",
    "subject": "物理",
    "category": "",
    "question_text": "図はダニエル電池（Zn｜ZnSO4 ‖ CuSO4｜Cu）の模式図である。この電池の標準起電力として正しいのはどれか。１つ選べ。\n\nただし、ZnとCuの半電池の標準電極電位はそれぞれ－0.763Vと＋0.337Vとする。",
    "choices": [
      {
        "key": 1,
        "text": "＋0.213 V"
      },
      {
        "key": 2,
        "text": "＋0.426 V"
      },
      {
        "key": 3,
        "text": "＋1.100 V"
      },
      {
        "key": 4,
        "text": "－0.426 V"
      },
      {
        "key": 5,
        "text": "－1.100 V"
      }
    ],
    "correct_answer": 3,
    "explanation": "負極での酸化反応：Zn→Zn2＋＋2e－\n\n正極での還元反応：Cu2＋＋2e－→Cu\n\nこのとき、電子は導線を通じて負極から正極へ流れる。\n\n標準起電力（E°）は、下記の式でも求めることができる。\n\n標準起電力（E°）＝正極の標準電極電位（E°正極）－負極の標準電極電位（E°負極）\n\nZnとCuの半電池の標準電極電位はそれぞれ－0.763Vと＋0.337Vであることから、ダニエル電池の標準起電力を下記のように求めることができる。\n\n標準起電力（E°）＝＋0.337V－（－0.763V）＝＋1.100V",
    "tags": [],
    "image_url": "/images/questions/110/q001.png"
  },
  {
    "id": "r110-003",
    "year": 110,
    "question_number": 3,
    "section": "必須",
    "subject": "物理",
    "category": "",
    "question_text": "難溶性塩である水酸化鉄（Ⅲ）（Fe(OH)₃）の純水中の溶解度をS mol/Lとすると、その溶解度積（Ksp）を正しく表しているのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "3S³ (mol/L)³"
      },
      {
        "key": 2,
        "text": "4S³ (mol/L)³"
      },
      {
        "key": 3,
        "text": "9S³ (mol/L)³"
      },
      {
        "key": 4,
        "text": "9S⁴ (mol/L)4"
      },
      {
        "key": 5,
        "text": "27S⁴ (mol/L)4"
      }
    ],
    "correct_answer": 5,
    "explanation": "水酸化鉄（Ⅲ）（Fe(OH)₃）の純水中の溶解度をS mol/Lとすると、飽和溶液中では、［Fe3＋］はS mol/L、［OH－］は3S mol/Lとなる。溶解度積Kspは［Fe3＋］［OH－］3で表すことができるため、Ksp＝S・（3S）3＝27S4(mol/L)4となる。",
    "tags": []
  },
  {
    "id": "r110-004",
    "year": 110,
    "question_number": 4,
    "section": "必須",
    "subject": "物理",
    "category": "",
    "question_text": "スピン量子の数が1/2である原子核が外部磁場の中に置かれると、そのエネルギーが2つのエネルギー準位に分かれることを表しているのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "化学シフト"
      },
      {
        "key": 2,
        "text": "McLafferty（マクラファティー）転位"
      },
      {
        "key": 3,
        "text": "ラジカル開裂"
      },
      {
        "key": 4,
        "text": "超微細分裂"
      },
      {
        "key": 5,
        "text": "ゼーマン分裂"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-005",
    "year": 110,
    "question_number": 5,
    "section": "必須",
    "subject": "物理",
    "category": "",
    "question_text": "溶媒中で解離しない薬物Xを50 mmol含む水溶液100 mLに酢酸エチルを加えて振りとう、静置したところ、二液相に分相し、酢酸エチル相中のXは45 mmolであった。Xの分配係数（酢酸エチル相中の濃度/水相中の濃度）を18とすると、酢酸エチル相の体積はどれか。１つ選べ。\n\nただし、分配に与える溶媒は互いの溶媒で飽和されており、水相の体積は100 mLとする。",
    "choices": [
      {
        "key": 1,
        "text": "50mL"
      },
      {
        "key": 2,
        "text": "100mL"
      },
      {
        "key": 3,
        "text": "150mL"
      },
      {
        "key": 4,
        "text": "200mL"
      },
      {
        "key": 5,
        "text": "250mL"
      }
    ],
    "correct_answer": 1,
    "explanation": "②水相中のXの量、水相中のXの濃度\n\n薬物Xは50mmol中の45mmolが酢酸エチル相に移動したため、水相中に残るXの量は、X水相＝50－45＝5mmolとなる。\n\nまた、水相の体積が100mLであることから、水相中のXの濃度は、C水相＝5mmol/100mLとなる。\n\n③酢酸エチル相の体積\n\n分配係数は、酢酸エチル相中のXの濃度と水相中のXの濃度の比であり、下記の式が成立する。\n\nP＝C酢酸エチル相／C水相＝18\n\n　酢酸エチルの体積をXmLとすると、C酢酸エチル相が45mmol /XmL、C水相が5mmol/100mLであることからC酢酸エチル相＝18×C水相（45mmol /XmL＝18×5mmol/100mL）が成立し、X＝50mLとなる。",
    "tags": []
  },
  {
    "id": "r110-006",
    "year": 110,
    "question_number": 6,
    "section": "必須",
    "subject": "化学",
    "category": "",
    "question_text": "問6          以下のアルドヘキソースＡのアノマーはどれか。1つ選べ。\nCH2OH\nO OH\nOH\nHO\nOH\nA\nCH2OH               CH2OH                     CH2OH                    CH2OH                     CH2OH\nHO           O OH              O OH                        O OH                   O        HO O\nOH                                            OH HO                    OH                    HO\nHO                        HO                       HO             OH               OH\nOH          OH    OH                                                 OH         OH\n1                 2                           3                      4                   5",
    "choices": [],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q006.png"
  },
  {
    "id": "r110-007",
    "year": 110,
    "question_number": 7,
    "section": "必須",
    "subject": "化学",
    "category": "",
    "question_text": "以下の薬物に含まれる金属元素Mとして適切なのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "Li"
      },
      {
        "key": 2,
        "text": "Mg"
      },
      {
        "key": 3,
        "text": "Al"
      },
      {
        "key": 4,
        "text": "Ca"
      },
      {
        "key": 5,
        "text": "Zn"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q007.png"
  },
  {
    "id": "r110-008",
    "year": 110,
    "question_number": 8,
    "section": "必須",
    "subject": "化学",
    "category": "",
    "question_text": "問8          以下の化合物のうち、最も酸性度が高いのはどれか。1つ選べ。\nOH              OH               OH         OH                  OH\nNH2        Cl                  NO2\n1               2                3          4                   5",
    "choices": [],
    "correct_answer": 5,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q008.png"
  },
  {
    "id": "r110-009",
    "year": 110,
    "question_number": 9,
    "section": "必須",
    "subject": "化学",
    "category": "",
    "question_text": "問9          以下の化学種のうち、ベンジルカチオンが最も安定化されているのはどれか。\n1つ選べ。\nH   ＋   H          H    ＋   H           H   ＋   H              H   ＋   H                 H   ＋   H\nOCH3                                        OCH3               OCH3                      OCH3\nOCH3                    OCH3                      H3CO\nOCH3\n1                   2                   3                      4                         5",
    "choices": [],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q009.png"
  },
  {
    "id": "r110-010",
    "year": 110,
    "question_number": 10,
    "section": "必須",
    "subject": "化学",
    "category": "",
    "question_text": "ビンクリスチンの生合成前駆体となるアミノ酸はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "オルニチン"
      },
      {
        "key": 2,
        "text": "チロシン"
      },
      {
        "key": 3,
        "text": "トリプトファン"
      },
      {
        "key": 4,
        "text": "フェニルアラニン"
      },
      {
        "key": 5,
        "text": "リシン"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q010.png"
  },
  {
    "id": "r110-011",
    "year": 110,
    "question_number": 11,
    "section": "必須",
    "subject": "生物",
    "category": "",
    "question_text": "血管平滑筋細胞を持たず血管内皮細胞と基底膜から構成され、栄養成分や老廃物の物質交換が行われるのはどれか。",
    "choices": [
      {
        "key": 1,
        "text": "大動脈"
      },
      {
        "key": 2,
        "text": "細動脈"
      },
      {
        "key": 3,
        "text": "毛細血管"
      },
      {
        "key": 4,
        "text": "大静脈"
      },
      {
        "key": 5,
        "text": "胸管"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\n大動脈は、体内の中で最も太い動脈であり、心臓から送り出された血液が通る血管である。\n\n２　誤\n\n細動脈は、動脈が枝分かれした細かい動脈であり、血圧の調整に関与している。\n\n３　正\n\n４　誤\n\n大静脈は、体中から集まる静脈を、心臓の右心房へと送る血管である。\n\n５　誤\n\n胸管は、鎖骨下静脈に接続し、リンパ液を血液中に送るリンパ管である。",
    "tags": []
  },
  {
    "id": "r110-012",
    "year": 110,
    "question_number": 12,
    "section": "必須",
    "subject": "生物",
    "category": "",
    "question_text": "問 12        核酸に含まれるプリン塩基のヒトにおける最終代謝産物はどれか。1つ選べ。\n1             O               2                    O               3       NH2\nN                                    N                     N\nHN                                 HN                             N\nN       N           H2N              N       N               N     N\nH                                    H                     H\n4                 O           5                O\nH\nN                            N\nHN                           HN\nO\nO            N       N       O            N       N\nH       H                    H       H",
    "choices": [
      {
        "key": 1,
        "text": "O"
      },
      {
        "key": 2,
        "text": "O"
      },
      {
        "key": 3,
        "text": "NH2"
      },
      {
        "key": 4,
        "text": "O"
      },
      {
        "key": 5,
        "text": "O"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q012.png"
  },
  {
    "id": "r110-013",
    "year": 110,
    "question_number": 13,
    "section": "必須",
    "subject": "生物",
    "category": "",
    "question_text": "真核生物において、転写開始の際にRNAポリメラーゼⅡの結合に必要なDNA上の領域はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "イントロン"
      },
      {
        "key": 2,
        "text": "エクソン"
      },
      {
        "key": 3,
        "text": "プロモーター"
      },
      {
        "key": 4,
        "text": "テロメア"
      },
      {
        "key": 5,
        "text": "ターミネーター"
      }
    ],
    "correct_answer": 3,
    "explanation": "◉プロモーター\n\n鋳型DNA上の転写開始領域\n\nRNAポリメラーゼが認識・結合する部位\n\n【真核細胞】\n\n転写開始点の上流にTATAboxとCCAAT配列が存在する場合があり、この領域をRNAポリメラーゼが認識する\n\n【大腸菌】\n\n転写開始点の上流にTTGACA配列、プリブナウボックスが存在する場合があり、いずれも転写開始の正確さ、効率を増す役割をしている\n\n１　誤\n\nイントロンは、真核生物の遺伝子において、mRNAへ翻訳されない非コード領域である。 転写されたmRNA前駆体（pre-mRNA）にはイントロンとエクソンが含まれるが、プライシングによってイントロンは除去される。なお、エクソンは、mRNAに残り、タンパク質の合成に関与する。\n\n２　誤\n\n解説1参照\n\n３　正\n\n４　誤\n\nテロメアは、真核生物の染色体の末端に存在する反復塩基配列であり、染色体を保護する役割を有している。テロメアは、細胞分裂のたびに短縮し、これが細胞老化や寿命と関連している。\n\n５　誤\n\nターミネーターは、転写の終了を指示するDNA領域であり、転写を正しい位置で終了させ、機能的なRNAの生成に関与する。",
    "tags": []
  },
  {
    "id": "r110-014",
    "year": 110,
    "question_number": 14,
    "section": "必須",
    "subject": "生物",
    "category": "",
    "question_text": "オステオカルシンとカルシウムイオンが結合できるように、グルタミン酸残基に対する翻訳後修飾はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アセチル化"
      },
      {
        "key": 2,
        "text": "メチル化"
      },
      {
        "key": 3,
        "text": "ミリストイル化"
      },
      {
        "key": 4,
        "text": "リン酸化"
      },
      {
        "key": 5,
        "text": "カルボキシ化"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-015",
    "year": 110,
    "question_number": 15,
    "section": "必須",
    "subject": "生物",
    "category": "",
    "question_text": "ウイルスゲノムを中心としてその周囲を取り囲むタンパク質の殻はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "エンベロープ"
      },
      {
        "key": 2,
        "text": "カプシド"
      },
      {
        "key": 3,
        "text": "コア"
      },
      {
        "key": 4,
        "text": "スパイク"
      },
      {
        "key": 5,
        "text": "ビリオン"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nエンベロープは、脂質二重膜であり、コロナウイルス、インフルエンザウイルスに存在する。\n\n２　正\n\n３　誤\n\nコアは、ウイルスゲノム（DNA、RNA）を含むウイルスの内部構造である。\n\n４　誤\n\nスパイクは、ウイルスの表面にある突起状のタンパク質であり、宿主細胞の受容体に結合し、感染の開始に関与する。\n\n例：インフルエンザウイルスにおけるヘマグルチニン（HA）やノイラミニダーゼ（NA）\n\n５　誤\n\nビリオンは、細胞外にあるウイルスのことであり、感染性を有するウイルス粒子のことである。",
    "tags": []
  },
  {
    "id": "r110-016",
    "year": 110,
    "question_number": 16,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "下図の年次推移を示す我が国の人口統計指標はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "出生率"
      },
      {
        "key": 2,
        "text": "合計特殊出生率"
      },
      {
        "key": 3,
        "text": "総再生産率"
      },
      {
        "key": 4,
        "text": "粗死亡率"
      },
      {
        "key": 5,
        "text": "年齢調整死亡率"
      }
    ],
    "correct_answer": 4,
    "explanation": "２　誤\n\n合計特殊出生率は、1人の女性が一生の間に産む平均子供数（男女合計）を示す指標である。1970年代以降、合計特殊出生率は長期的な低下傾向にあり、2023年（令和5年）には過去最低の1.20を記録した。\n\n３　誤\n\n総再生産率は、1人の女性が一生の間に産む女児の平均数を示す指標である。総再生産率は第二次ベビーブームの1970年代をピークに減少が続いており、2022年（令和4年）には0.61となった。\n\n４　正\n\n粗死亡率は人口1,000人あたりの1年間の死亡数である。1947年（昭和22年）以降の粗死亡率は医療の進歩等により低下傾向にあったが、1983年（昭和58年）頃を境に人口の高齢化の影響を受け、粗死亡率は緩やかな上昇傾向を示している。\n\n５　誤\n\n年齢調整死亡率は、一定の基準人口（例：平成27年モデル人口）を用いて年齢構成の違いを補正した死亡率であり、高齢化の影響を排除した形で評価する指標である。実際の年齢調整死亡率は低下傾向を示している。",
    "tags": [],
    "image_url": "/images/questions/110/q016.png"
  },
  {
    "id": "r110-017",
    "year": 110,
    "question_number": 17,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "再興感染症はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "結核"
      },
      {
        "key": 2,
        "text": "クリプトスポリジウム症"
      },
      {
        "key": 3,
        "text": "重症急性呼吸器症候群（SARS）"
      },
      {
        "key": 4,
        "text": "レジオネラ症"
      },
      {
        "key": 5,
        "text": "ロタウイルス感染症"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n結核は再興感染症であり、病原体は結核菌（細菌）である。一時期は制圧されたと考えられていたが、近年の高齢化や多剤耐性菌の出現、HIV感染症の広がりなどにより再び注目されるようになった。\n\n２　誤\n\nクリプトスポリジウム症は新興感染症に分類され、病原体は原虫である。水道水などを介した集団感染が問題となった。\n\n３　誤\n\nSARS（重症急性呼吸器症候群）は新興感染症であり、病原体はウイルスである。2002年に中国を中心に流行し、世界的な公衆衛生上の問題となった。\n\n４　誤\n\nレジオネラ症は新興感染症であり、病原体は細菌である。エアロゾル化した汚染水の吸入によって感染することがある。\n\n５　誤\n\nロタウイルス感染症は新興感染症に分類され、病原体はウイルスである。乳幼児に重篤な胃腸炎を引き起こすことで知られている。",
    "tags": []
  },
  {
    "id": "r110-018",
    "year": 110,
    "question_number": 18,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "有害物質の経皮曝露を防ぐために化学防護手袋を使用することは、労働衛生の5管理のうち、どれに該当するか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "総括管理"
      },
      {
        "key": 2,
        "text": "健康管理"
      },
      {
        "key": 3,
        "text": "作業管理"
      },
      {
        "key": 4,
        "text": "労働衛生教育"
      },
      {
        "key": 5,
        "text": "作業環境管理"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-019",
    "year": 110,
    "question_number": 19,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "以下の構造式で示す腐敗アミンの前駆体となるアミノ酸はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "リシン"
      },
      {
        "key": 2,
        "text": "チロシン"
      },
      {
        "key": 3,
        "text": "ヒスチジン"
      },
      {
        "key": 4,
        "text": "アルギニン"
      },
      {
        "key": 5,
        "text": "トリプトファン"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nリシンは、脱炭酸反応により「カダベリン」となる。カダベリンは、悪臭を伴う腐敗物質のひとつである。\n\n２　誤\n\nチロシンは、 脱炭酸反応により「チラミン」となる。チラミンは、交感神経系を刺激し、血圧上昇作用を示す。\n\n３　正\n\n前記参照\n\n４　誤\n\nアルギニンは、脱炭酸反応により「アグマチン」となる。 アグマチンは、中枢神経系や血管系への作用が報告されている。\n\n５　誤\n\nトリプトファンは、脱炭酸反応により「トリプタミン」となる。さらに、脱アミノ反応が起こると、「スカトール」「インドール」などの悪臭の原因物質が生成される。",
    "tags": [],
    "image_url": "/images/questions/110/q019.png"
  },
  {
    "id": "r110-020",
    "year": 110,
    "question_number": 20,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "コウジカビAspergillus flavusが産生する主要な肝発がん物質はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "シトリニン"
      },
      {
        "key": 2,
        "text": "パツリン"
      },
      {
        "key": 3,
        "text": "アフラトキシン B₁"
      },
      {
        "key": 4,
        "text": "フモニシン B₁"
      },
      {
        "key": 5,
        "text": "デオキシニバレノール"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nシトリニンは、アオカビ Penicillium citrinum などが産生するマイコトキシンであり、主に腎障害の原因物質とされる。\n\n２　誤\n\nパツリンは、アオカビ Penicillium patulum や、コウジカビ Aspergillus clavatus が産生するマイコトキシンであり、消化管出血の原因となる。\n\n３　正\n\n前記参照\n\n４　誤\n\nフモニシンB₁は、アカカビ（Fusarium 属）が産生するマイコトキシンであり、トウモロコシを汚染し、胎児の神経管閉鎖障害などとの関連が報告されている。\n\n５　誤\n\nデオキシニバレノールは、アカカビ（Fusarium 属）が産生する毒素であり、免疫抑制作用や造血障害などが特徴的である。",
    "tags": []
  },
  {
    "id": "r110-021",
    "year": 110,
    "question_number": 21,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "主に非意図的に生成することから化審法（注）で規制されていないのはどれか。１つ選べ。\n\n（注）化審法：化学物質の審査及び製造等の規制に関する法律",
    "choices": [
      {
        "key": 1,
        "text": "ポリ塩化ジベンゾ-p-ジオキシン"
      },
      {
        "key": 2,
        "text": "ポリ塩化ビフェニル"
      },
      {
        "key": 3,
        "text": "ペルフルオロ（オクタン-1-スルホン酸）"
      },
      {
        "key": 4,
        "text": "ヘキサブロモビフェニル"
      },
      {
        "key": 5,
        "text": "ビス（トリブチルスズ）＝オキシド"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nポリ塩化ジベンゾ-p-ジオキシン（PCDD）は、焼却工程などで非意図的に副生成される物質であり、化審法の規制対象外である。\n\n２　誤\n\nポリ塩化ビフェニル（PCB）は、化審法における第一種特定化学物質に該当し、カネミ油症の主因となった物質。\n\n３　誤\n\nペルフルオロオクタンスルホン酸（PFOS）も、化審法の第一種特定化学物質に該当する。\n\n４　誤\n\nヘキサブロモビフェニルも、化審法の第一種特定化学物質に該当する。\n\n５　誤\n\nビス（トリブチルスズ）＝オキシド（TBTO）は、化審法の第一種特定化学物質に該当する。",
    "tags": []
  },
  {
    "id": "r110-022",
    "year": 110,
    "question_number": 22,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "非電離放射線のうち、眼の水晶体タンパク質の変性によってガラス工白内障を引き起こすのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "UVA"
      },
      {
        "key": 2,
        "text": "UVB"
      },
      {
        "key": 3,
        "text": "UVC"
      },
      {
        "key": 4,
        "text": "赤外線"
      },
      {
        "key": 5,
        "text": "可視光線"
      }
    ],
    "correct_answer": 4,
    "explanation": "１　誤\n\nUVAは、皮膚内のメラニン沈着（サンタン）を引き起こす。また、皮膚の老化やシワの原因となる。水晶体への直接的な影響は弱い。\n\n２　誤\n\nUVBは、皮膚の紅斑ややけど（サンバーン）を引き起こし、DNA損傷の原因ともなるとともに皮膚内のメラニン沈着（サンタン）を引き起こす。また、ビタミンD₃生成にも関与するが、水晶体障害を直接的に引き起こすわけではない。\n\n３　誤\n\nUVCは、DNAに直接損傷を与えるため、皮膚がんの原因となる。なお、ピリミジン二量体（隣接したピリミジン間で形成されるピリミジンダイマー）の形成に関与している。\n\n４　正\n\n前記参照\n\n５　誤\n\n可視光線は、ヒトの目が感知できる光であり、視覚刺激により視覚疲労や中枢神経への影響を引き起こすが、水晶体障害の主因ではない。",
    "tags": []
  },
  {
    "id": "r110-023",
    "year": 110,
    "question_number": 23,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "問 23 水道水質基準の基準項目に定められている大腸菌を特異的に検出するための基\n質はどれか。1つ選べ。\n1                                   2                 Br                     3\nCl\nNH\nCH2OH                             CH2OH                                        CH2OH\nO                                     O                                               O   CN\nHO        O                       HO            O                                                O\nOH               NO2              OH                                           OH\nHO\nOH                                    OH                                               OH\n4                            CH3                    5\n－\nO\nCO2H                                               CH2OH                  N\nO       O         O                              O        N    ＋       CH3\nO                                                O\nOH                                                 OH\nHO                                                 HO\nOH                                               OH",
    "choices": [
      {
        "key": 1,
        "text": "2                 Br                     3"
      },
      {
        "key": 2,
        "text": "CH3                    5"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q023.png"
  },
  {
    "id": "r110-024",
    "year": 110,
    "question_number": 24,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "湖沼で藍藻類や放線菌が発生するカビ臭の原因物質はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "クロラミン"
      },
      {
        "key": 2,
        "text": "ジェオスミン"
      },
      {
        "key": 3,
        "text": "トリハロメタン"
      },
      {
        "key": 4,
        "text": "クロロフェノール"
      },
      {
        "key": 5,
        "text": "ミクロシスチン"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nクロラミンは、モノクロラミン（NH₂Cl）、ジクロラミン（NHCl₂）、トリクロラミン（NCl₃）の総称で、アンモニア性窒素を含む水を塩素処理した際に生成される結合残留塩素である。\n\n２　正\n\n前記参照\n\n３　誤\n\nトリハロメタンは、フミン質などの有機物が塩素処理されることで生成される副生成物であり、発がん性や遺伝毒性などの毒性を示す。\n\n４　誤\n\nクロロフェノールは、フェノール類を含む排水が塩素処理されることで生成される副生成物であり、異臭の原因にはなりうるが、藍藻や放線菌由来ではない。\n\n５　誤\n\nミクロシスチンは、藍藻類が産生する肝臓毒性を持つ毒素であり、臭気ではなく毒性物質として問題となる。",
    "tags": []
  },
  {
    "id": "r110-025",
    "year": 110,
    "question_number": 25,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "逆転層は大気汚染物質の滞留を引き起こす。盆地や谷間などの低地に冷たい空気が流入して発生するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "沈降性逆転層"
      },
      {
        "key": 2,
        "text": "地形性逆転層"
      },
      {
        "key": 3,
        "text": "放射性逆転層"
      },
      {
        "key": 4,
        "text": "移流性逆転層"
      },
      {
        "key": 5,
        "text": "前線性逆転層"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n沈降性逆転層は、高気圧圏内で下降気流があると、空気が圧縮され断熱昇温を起こし、逆転層が形成される。\n\n２　正\n\n地形性逆転層は、盆地や谷間などの低地に冷たい空気が流入して発生する。\n\n３　誤\n\n放射性逆転層は、夜間の放射冷却により地表近くの空気が冷えることで発生する。晴れて風の弱い冬季などに多い。\n\n４　誤\n\n移流性逆転層は、冷たい空気の上に暖かい空気が水平移動して乗る（移流する）ことで発生する。\n\n５　誤\n\n前線性逆転層は、気団の交差による気温逆転が発生することが主な要因であり、寒気団の上に暖気団が乗る前線面で発生する。",
    "tags": []
  },
  {
    "id": "r110-026",
    "year": 110,
    "question_number": 26,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "モルモット摘出回腸標本の限界反応について、アセチルコリン単独による濃度–反応曲線（破線）と、薬物X存在下でのアセチルコリンによる濃度–反応曲線（実線）を作成したところ、下図のようになった。 薬物Xはどれか。１つ選べ。ただし、アセチルコリン単独により生じる最大収縮を100％とした。また、薬物Xの単独では収縮反応が生じなかった。",
    "choices": [
      {
        "key": 1,
        "text": "ヒスタミン"
      },
      {
        "key": 2,
        "text": "アトロピン"
      },
      {
        "key": 3,
        "text": "ピリドスチグミン"
      },
      {
        "key": 4,
        "text": "パパベリン"
      },
      {
        "key": 5,
        "text": "ベタネコール"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q026.png"
  },
  {
    "id": "r110-027",
    "year": 110,
    "question_number": 27,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "フェニレフリンの昇圧作用の機序はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アドレナリンα1受容体刺激"
      },
      {
        "key": 2,
        "text": "アドレナリンα2受容体遮断"
      },
      {
        "key": 3,
        "text": "アドレナリンβ1受容体刺激"
      },
      {
        "key": 4,
        "text": "カテコール-O-メチルトランスフェラーゼ阻害"
      },
      {
        "key": 5,
        "text": "ノルアドレナリン再取り込み阻害"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-028",
    "year": 110,
    "question_number": 28,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "ピロカルピンが毛様体筋を収縮させる機序はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アドレナリンα1受容体遮断"
      },
      {
        "key": 2,
        "text": "アドレナリンα2受容体刺激"
      },
      {
        "key": 3,
        "text": "アドレナリンβ2受容体遮断"
      },
      {
        "key": 4,
        "text": "アセチルコリンM2受容体遮断"
      },
      {
        "key": 5,
        "text": "アセチルコリンM3受容体刺激"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-029",
    "year": 110,
    "question_number": 29,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "ロクロニウムの筋弛緩作用に関わる作用点はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アセチルコリンNM受容体"
      },
      {
        "key": 2,
        "text": "電位依存性Na＋チャネル"
      },
      {
        "key": 3,
        "text": "リアノジン受容体"
      },
      {
        "key": 4,
        "text": "コリンアセチルトランスフェラーゼ"
      },
      {
        "key": 5,
        "text": "コリンエステラーゼ"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-030",
    "year": 110,
    "question_number": 30,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "オレキシン受容体を選択的に遮断することで、睡眠を誘導するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ヒドロキシジン"
      },
      {
        "key": 2,
        "text": "リルマザホン"
      },
      {
        "key": 3,
        "text": "レンボレキサント"
      },
      {
        "key": 4,
        "text": "ゾピクロン"
      },
      {
        "key": 5,
        "text": "ペントバルビタール"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\nリルマザホンは、ベンゾジアゼピン系薬であり、GABAA受容体に存在するベンゾジアゼピン結合部位に結合し、GABA神経系を活性化することにより催眠作用を示す。\n\n３　正\n\nレンボレキサントは、オレキシン受容体拮抗薬であり、覚醒を促進する神経ペプチドであるオレキシンAおよびBの受容体への結合を可逆に阻害することにより脳を覚醒状態から睡眠状態へ移行させる。\n\n４　誤\n\nゾピクロンは、非ベンゾジアゼピン系薬であり、GABAA受容体に存在するベンゾジアゼピン結合部位に結合し、GABA神経系を活性化することにより催眠作用を示す。\n\n５　誤\n\nペントバルビタールは、バルビツール酸系薬であり、GABAA受容体に存在するバルビツール酸結合部位に結合し、GABA神経系を活性化することにより催眠作用を示す。",
    "tags": []
  },
  {
    "id": "r110-031",
    "year": 110,
    "question_number": 31,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "タンドスピロンの抗不安作用に関わる作用点はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ドパミンD₂受容体"
      },
      {
        "key": 2,
        "text": "γ-アミノ酪酸GABAA受容体"
      },
      {
        "key": 3,
        "text": "ニコチン性アセチルコリン受容体"
      },
      {
        "key": 4,
        "text": "セロトニン5-HT₁A受容体"
      },
      {
        "key": 5,
        "text": "ヒスタミンH₁受容体"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-032",
    "year": 110,
    "question_number": 32,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "グルタミン酸NMDA受容体を遮断するアルツハイマー型認知症治療薬はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "リバスチグミン"
      },
      {
        "key": 2,
        "text": "ドネペジル"
      },
      {
        "key": 3,
        "text": "エダラボン"
      },
      {
        "key": 4,
        "text": "メマンチン"
      },
      {
        "key": 5,
        "text": "ガランタミン"
      }
    ],
    "correct_answer": 4,
    "explanation": "１　誤\n\nリバスチグミンは、中枢のアセチルコリンエステラーゼ（ChE）を阻害し、シナプス間隙のアセチルコリン（ACh）濃度を上昇させる。また、本剤は、ブチリルコリンエステラーゼを阻害作用も有している。\n\n２　誤\n\nドネペジルは、中枢のChEを阻害し、シナプス間隙のACh濃度を上昇させる。\n\n３　誤\n\nエダラボンは、フリーラジカルを消去して脂質の過酸化を抑制し、脳梗塞急性期において脳保護作用を示す。\n\n４　正\n\n前記参照\n\n５　誤\n\nガランタミンは、中枢のChEを阻害し、シナプス間隙のACh濃度を上昇させる。また、本剤は、ニコチン性アセチルコリン受容体アロステリック部位に結合し、ニコチン性アセチルコリン受容体感受性を増大させる。",
    "tags": []
  },
  {
    "id": "r110-033",
    "year": 110,
    "question_number": 33,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "尋常性乾癬の治療に用いられるセクキヌマブの標的分子はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ホスホジエステラーゼIV（PDE IV）"
      },
      {
        "key": 2,
        "text": "チロシンキナーゼ2（Tyk2）"
      },
      {
        "key": 3,
        "text": "ビタミンD受容体"
      },
      {
        "key": 4,
        "text": "IL-12及びIL-23"
      },
      {
        "key": 5,
        "text": "IL-17A"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-034",
    "year": 110,
    "question_number": 34,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "細胞内サイクリックGMP（cGMP）濃度上昇作用及びK＋チャネル開口作用を併せ持つ狭心症治療薬はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ニコランジル"
      },
      {
        "key": 2,
        "text": "ベラパミル"
      },
      {
        "key": 3,
        "text": "ジルチアゼム"
      },
      {
        "key": 4,
        "text": "硝酸イソソルビド"
      },
      {
        "key": 5,
        "text": "アテノロール"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n前記参照\n\n２　誤\n\nベラパミルは、Ca 2＋チャネル遮断薬であり、心筋のL型Ca 2＋チャネルを遮断することにより心機能を抑制し、酸素消費量を低下させる。\n\n３　誤\n\nジルチアゼムは、Ca 2＋チャネル遮断薬であり、血管平滑筋のL型Ca 2＋チャネルを遮断し、冠動脈を拡張することで心臓への酸素供給量を増加させる。また、心筋のL型Ca2＋チャネルを遮断することにより心機能を抑制し、酸素消費量を低下させる。\n\n４　誤\n\n硝酸イソソルビドは、NOを遊離して血管平滑筋細胞の可溶性グアニル酸シクラーゼを活性化し、細胞内のcGMPを上昇させる。その結果、末梢の静脈が拡張することで静脈還流量が低下し、前負荷を軽減するとともに、末梢の動脈が拡張することで末梢血管抵抗が減少し、後負荷を軽減する。\n\n５　誤\n\nアテノロールは、選択的アドレナリンβ1受容体遮断薬であり、心機能を抑制し、酸素消費量を低下させる。",
    "tags": []
  },
  {
    "id": "r110-035",
    "year": 110,
    "question_number": 35,
    "section": "必須",
    "subject": "薬理",
    "category": "",
    "question_text": "アンチトロンビン非依存的に血液凝固第Xa因子の活性を直接阻害する抗凝固薬はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "エノキサパリン"
      },
      {
        "key": 2,
        "text": "フォンダパリヌクス"
      },
      {
        "key": 3,
        "text": "ダビガトランエテキシラート"
      },
      {
        "key": 4,
        "text": "ワルファリン"
      },
      {
        "key": 5,
        "text": "エドキサバン"
      }
    ],
    "correct_answer": 5,
    "explanation": "１　誤\n\nエノキサパリンは、低分子ヘパリンであり、アンチトロンビン依存的に第Xa因子を阻害することで抗凝固作用を示す。\n\n２　誤\n\nフォンダパリヌクスは、第Xa阻害剤であり、アンチトロンビン依存的に第Xa因子を阻害することで抗凝固作用を示す。\n\n３　誤\n\nダビガトランエテキシラートは、直接トロンビン阻害薬であり、直接トロンビンの機能を抑制することで抗凝固作用を示す。\n\n４　誤\n\nワルファリンは、ビタミンK拮抗薬であり、ビタミンK依存性凝固因子（Ⅱ、Ⅶ、Ⅸ、Ⅹ）の合成を阻害することで抗凝固作用を示す。\n\n５　正\n\n前記参照",
    "tags": []
  },
  {
    "id": "r110-036",
    "year": 110,
    "question_number": 36,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "タキキニンNK₁受容体を遮断して、抗悪性腫瘍薬による遅発性嘔吐を抑制するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "オンダンセトロン"
      },
      {
        "key": 2,
        "text": "ドンペリドン"
      },
      {
        "key": 3,
        "text": "アプレピタント"
      },
      {
        "key": 4,
        "text": "ジメンヒドリナート"
      },
      {
        "key": 5,
        "text": "メトクロプラミド"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nオンダンセトロンは、5−HT3受容体を遮断することで抗悪性腫瘍薬による嘔吐を抑制する。\n\n２　誤\n\nドンペリドンは、ドパミンD2受容体を遮断することで嘔吐を抑制する。\n\n３　正\n\n前記参照\n\n４　誤\n\nジメンヒドリナートは、ヒスタミンH1受容体を遮断することで嘔吐を抑制する。\n\n５　誤\n\nメトクロプラミドは、ドパミンD2受容体を遮断することで嘔吐を抑制する。",
    "tags": []
  },
  {
    "id": "r110-037",
    "year": 110,
    "question_number": 37,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "高尿酸血症治療薬トピロキソスタットが阻害するのはどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "シクロオキシゲナーゼ"
      },
      {
        "key": 2,
        "text": "キサンチンオキシダーゼ"
      },
      {
        "key": 3,
        "text": "尿酸オキシダーゼ"
      },
      {
        "key": 4,
        "text": "尿酸トランスポーター"
      },
      {
        "key": 5,
        "text": "有機アニオントランスポーター"
      }
    ],
    "correct_answer": 2,
    "explanation": "トピロキソスタットは、非競合的にキサンチンオキシダーゼを阻害することで尿酸の生合成を抑制する。",
    "tags": []
  },
  {
    "id": "r110-038",
    "year": 110,
    "question_number": 38,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "プロゲステロン受容体を刺激して、子宮内膜細胞の増殖を抑制するのはどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "リュープロレリン"
      },
      {
        "key": 2,
        "text": "タモキシフェン"
      },
      {
        "key": 3,
        "text": "ジエノゲスト"
      },
      {
        "key": 4,
        "text": "エンザルタミド"
      },
      {
        "key": 5,
        "text": "デュタステリド"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nリュープロレリンは、GnRH受容体アゴニストであり、持続的にGnRH受容体を刺激し、GnRH受容体のダウンレギュレーションを誘発することで卵胞刺激ホルモン（FSH）、黄体形成ホルモン（LH）の分泌を抑制する。\n\n２　誤\n\nタモキシフェンは、エストロゲン受容体調節薬であり、主に乳腺において、抗エストロゲン作用を示すが、子宮内膜、骨、肝臓において、エストロゲン作用を示す。\n\n３　正\n\n前記参照\n\n４　誤\n\nエンザルタミドは、抗アンドロゲン薬であり、前立腺細胞のアンドロゲン受容体を遮断する。\n\n５　誤\n\nデュタステリドは、5α還元酵素阻害薬であり、非選択的に5α還元酵素を阻害する。",
    "tags": []
  },
  {
    "id": "r110-039",
    "year": 110,
    "question_number": 39,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "ペプチドグリカン前駆体のペンタペプチド末端のD-アラニル-D-アラニンと結合して、細菌の細胞壁合成を阻害するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アミカシン"
      },
      {
        "key": 2,
        "text": "セファゾリン"
      },
      {
        "key": 3,
        "text": "バンコマイシン"
      },
      {
        "key": 4,
        "text": "メロペネム"
      },
      {
        "key": 5,
        "text": "ミカファンギン"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nアミカシンは、アミノグリコシド系抗生物質であり、細菌の小サブユニット（30Sサブユニット）に結合し、タンパク質の合成を阻害する。\n\n２　誤\n\nセファゾリンは、セフェム系抗生物質であり、ペニシリン結合タンパク質に結合し、ペプチドグリカンの合成を阻害する。\n\n３　正\n\n４　誤\n\nメロペネムは、カルバペネム系抗菌薬であり、ペニシリン結合タンパク質に結合し、ペプチドグリカンの合成を阻害する。\n\n５　誤\n\nミカファンギンは、キャンディン系抗真菌薬であり、真菌の細胞壁合成に関わるβ–D-グルカン合成酵素を阻害し、細胞壁合成を抑制する。",
    "tags": []
  },
  {
    "id": "r110-040",
    "year": 110,
    "question_number": 40,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "HER2（ヒト上皮増殖因子受容体2型）と結合することにより、乳がん細胞の増殖を抑制するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "エキセメスタン"
      },
      {
        "key": 2,
        "text": "トラスツズマブ"
      },
      {
        "key": 3,
        "text": "ベバシズマブ"
      },
      {
        "key": 4,
        "text": "ダウノルビシン"
      },
      {
        "key": 5,
        "text": "ブスルファン"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nエキセメスタンは、エストロゲン合成阻害薬であり、エストロゲン合成に関与するアロマターゼを阻害し、アンドロゲンからエストロゲンの合成を阻害する。\n\n２　正\n\n３　誤\n\nベバシズマブは、VEGF阻害薬であり、VEGFに結合し、VEGFの受容体への結合を阻害することで、血管新生を抑制する。\n\n４　誤\n\nダウノルビシンは、アントラサイクリン系薬であり、DNAの間に入り込み（インターカレーション）転写過程を阻害し、DNAポリメラーゼやDNA依存性RNAポリメラーゼを阻害することでDNA、RNA合成を阻害する。\n\n５　誤\n\nブスルファンは、アルキル化薬であり、DNAをアルキル化し、DNAの複製・転写を阻害する。",
    "tags": []
  },
  {
    "id": "r110-041",
    "year": 110,
    "question_number": 41,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "下図のように、細胞膜の形態変化を伴って高分子医薬品を細胞内へ取り込む輸送機構はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "単純拡散"
      },
      {
        "key": 2,
        "text": "促進拡散"
      },
      {
        "key": 3,
        "text": "一次性能動輸送"
      },
      {
        "key": 4,
        "text": "二次性能動輸送"
      },
      {
        "key": 5,
        "text": "膜動輸送"
      }
    ],
    "correct_answer": 5,
    "explanation": "エンドサイトーシス（endocytosis）：細胞外からの取り込み\n\n例\n\n・ファゴサイトーシス（固体の取り込み）\n\n・ピノサイトーシス（液体・小分子の取り込み）\n\n・受容体依存性エンドサイトーシス（高分子や特定のリガンド）\n\nエキソサイトーシス（exocytosis）：細胞内からの分泌\n\n高分子医薬品（インスリン、抗体、タンパク質製剤など）は、受容体依存性エンドサイトーシスによって細胞内に取り込まれる。",
    "tags": [],
    "image_url": "/images/questions/110/q041.png"
  },
  {
    "id": "r110-042",
    "year": 110,
    "question_number": 42,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "経口投与された薬物が吸収される経路として、正しいのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "小腸 → リンパ管 → 大腸 → 全身循環系"
      },
      {
        "key": 2,
        "text": "小腸 → リンパ管 → 肝臓 → 全身循環系"
      },
      {
        "key": 3,
        "text": "小腸 → 門脈 → 大腸 → 全身循環系"
      },
      {
        "key": 4,
        "text": "小腸 → 門脈 → 肝臓 → 全身循環系"
      },
      {
        "key": 5,
        "text": "小腸 → 胆管 → 大腸 → 全身循環系"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-043",
    "year": 110,
    "question_number": 43,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "炎症性疾患時に増加し、プロプラノロールが最も強く結合する血漿タンパク質はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アルブミン"
      },
      {
        "key": 2,
        "text": "α-グロブリン"
      },
      {
        "key": 3,
        "text": "フィブリノーゲン"
      },
      {
        "key": 4,
        "text": "C反応性タンパク質"
      },
      {
        "key": 5,
        "text": "α1-酸性糖タンパク質"
      }
    ],
    "correct_answer": 5,
    "explanation": "α₁-酸性糖タンパク質は、急性期反応タンパク質の一つであり、炎症性疾患や悪性腫瘍、術後などに増加する。 そのため、炎症時にはα₁-酸性糖タンパク質の濃度が上昇し、塩基性薬物の血中結合率が変化する可能性がある。",
    "tags": []
  },
  {
    "id": "r110-044",
    "year": 110,
    "question_number": 44,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "薬物代謝における第Ⅱ相反応に関与するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "シトクロムP450"
      },
      {
        "key": 2,
        "text": "UDP-グルクロン酸転移酵素"
      },
      {
        "key": 3,
        "text": "フラビン含有モノオキシゲナーゼ"
      },
      {
        "key": 4,
        "text": "アルコール脱水素酵素"
      },
      {
        "key": 5,
        "text": "モノアミン酸化酵素"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nシトクロムP450は、第Ⅰ相反応（酸化、還元反応）に関与する酵素である。\n\n２　正\n\n　UDP-グルクロン酸転移酵素は第Ⅱ相反応に関与する代表的な酵素であり、UDP-グルクロン酸を供与体として、薬物と抱合させて水溶性を高め、排泄を促進する。\n\n３　誤\n\nフラビン含有モノオキシゲナーゼは、第Ⅰ相反応（酸化反応）に関与する酵素である。\n\n４　誤\n\nアルコール脱水素酵素は、第Ⅰ相反応（アルコールをアルデヒド、ケトンに酸化する反応）に関与する酵素である。\n\n５　誤\n\nモノアミン酸化酵素は、第Ⅰ相反応（カテコールアミンを酸化する反応）に関与する酵素である。",
    "tags": []
  },
  {
    "id": "r110-045",
    "year": 110,
    "question_number": 45,
    "section": "必須",
    "subject": "薬剤",
    "category": "",
    "question_text": "問 45         下図は腎臓のネフロンを模式的に示したものである。図中の 1 ～ 5 のうち、有\n機アニオントランスポーター（OAT₁、OAT₃）を介した薬物の輸送を表すのはど\nれか。1つ選べ。\nただし、図中の矢印の向きは薬物が移行する方向を示す。\n血液\n糸球体\n近位尿細管\nヘンレ係蹄\n遠位尿細管        5\n排泄",
    "choices": [],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q045.png"
  },
  {
    "id": "r110-046",
    "year": 110,
    "question_number": 46,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "体内動態が線形1-コンパートメントモデルに従う薬物を経口投与した場合、最高血中濃度到達時間が短縮する要因はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "投与量の減少"
      },
      {
        "key": 2,
        "text": "吸収率の上昇"
      },
      {
        "key": 3,
        "text": "分布容積の増大"
      },
      {
        "key": 4,
        "text": "吸収速度定数の上昇"
      },
      {
        "key": 5,
        "text": "消失速度定数の低下"
      }
    ],
    "correct_answer": 4,
    "explanation": "１　誤\n\n①式より、投与量が減少してもtmaxは変化しない。\n\n２　誤\n\n①式より、吸収率が上昇してもtmaxは変化しない。\n\n３　誤\n\n①式より、分布容積が増大してもtmaxは変化しない。\n\n４　正\n\n①式より、吸収速度定数が上昇すると、tmaxは短縮する。\n\n５　誤\n\n①式より、消失速度定数が低下すると、tmaxは延長する。",
    "tags": []
  },
  {
    "id": "r110-047",
    "year": 110,
    "question_number": 47,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "体内動態が線形1-コンパートメントモデルに従い、消失半減期が2時間である薬物を静脈内定速注入する。投与開始後、薬物の血中濃度が定常状態の血中濃度の75%に到着する時間（h）はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "1"
      },
      {
        "key": 2,
        "text": "2"
      },
      {
        "key": 3,
        "text": "3"
      },
      {
        "key": 4,
        "text": "4"
      },
      {
        "key": 5,
        "text": "5"
      }
    ],
    "correct_answer": 4,
    "explanation": "・消失半減期：2時間\n\n・到達したい濃度：定常状態の75%\n\n上記表より、定常状態の75%に到達するのは、2 ×t1/2＝4 時間である。",
    "tags": []
  },
  {
    "id": "r110-048",
    "year": 110,
    "question_number": 48,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "ある薬物の肝固有クリアランス（CLint）が肝血流量（Qh）と比較して十分に小さい場合、その薬物の肝クリアランスはどのように近似できるか。１つ選べ。\n\n　ただし、fuは血漿タンパク非結合形分率とする。",
    "choices": [
      {
        "key": 1,
        "text": "Qh"
      },
      {
        "key": 2,
        "text": "CLint"
      },
      {
        "key": 3,
        "text": "fu・Qh"
      },
      {
        "key": 4,
        "text": "fu・CLint"
      },
      {
        "key": 5,
        "text": "CLint/fu"
      }
    ],
    "correct_answer": 4,
    "explanation": "肝固有クリアランス（CLint）が肝血流量（Qh）と比較して十分に小さい場合、①式の分母であるQh＋fp・CLintはQhと近似することができ、CLh≒fp・CLintとなる。",
    "tags": []
  },
  {
    "id": "r110-049",
    "year": 110,
    "question_number": 49,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "陽イオン性界面活性剤はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ステアリン酸ナトリウム"
      },
      {
        "key": 2,
        "text": "ポリソルベート80"
      },
      {
        "key": 3,
        "text": "ラウリル硫酸ナトリウム"
      },
      {
        "key": 4,
        "text": "レシチン"
      },
      {
        "key": 5,
        "text": "ベンゼトニウム塩化物"
      }
    ],
    "correct_answer": 5,
    "explanation": "２　誤\n\nポリソルベート80は、非イオン性界面活性剤であり、主に乳化剤として用いられる。\n\n３　誤\n\nラウリル硫酸ナトリウムは、陰イオン性界面活性剤であり、主に乳化剤として用いられる。\n\n４　誤\n\nレシチンは、両性界面活性剤であり、主に乳化剤として用いられる。\n\n５　正\n\nベンゼトニウム塩化物は、陽イオン界面活性剤であり、殺菌作用を有するため、手指・皮膚の消毒、点眼剤の保存剤として用いられる。",
    "tags": []
  },
  {
    "id": "r110-050",
    "year": 110,
    "question_number": 50,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "造粒に用いる機器のうち、混合、造粒、乾燥の工程を同一装置内で行うことができるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "流動層造粒機"
      },
      {
        "key": 2,
        "text": "転動造粒機"
      },
      {
        "key": 3,
        "text": "押出し造粒機"
      },
      {
        "key": 4,
        "text": "噴霧乾燥造粒機"
      },
      {
        "key": 5,
        "text": "破砕造粒機"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n転動造粒機は、転動している粉末に結合剤溶液を噴霧するもので、球型の粒子が得られる。\n\n３　誤\n\n押出し造粒機は、一定孔径のスクリーンから薬物と添加剤からなる混練物を押し出し、適当なサイズにカットして比較的密度の高い円柱状の造粒物が得られる。\n\n４　誤\n\n熱風気流中に薬物と添加剤からなる溶液もしくは懸濁液を噴霧し、急速に乾燥させる造粒法である。比較的小さな球形の造粒物が得られる。また、濃縮、造粒、乾燥を一連の工程を一つのプロセスで完了できる。\n\n５　誤\n\n破砕造粒機は、粉体に強圧を加えて乾燥状態のまま塊状とし、それを粉砕し適切な粒子径をもつ粉体とする。混合した粉末状の原料を圧縮形成後に粉砕するため、不定型な造粒物が得られる。水や熱に不安定な医薬品の造粒に適している。",
    "tags": []
  },
  {
    "id": "r110-051",
    "year": 110,
    "question_number": 51,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "構造粘性を有する製剤でみられる、下図のレオグラムを示す現象はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "クリープ"
      },
      {
        "key": 2,
        "text": "チキソトロピー"
      },
      {
        "key": 3,
        "text": "応力緩和"
      },
      {
        "key": 4,
        "text": "ダイラタンシー"
      },
      {
        "key": 5,
        "text": "コアセルベーション"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q051.png"
  },
  {
    "id": "r110-052",
    "year": 110,
    "question_number": 52,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "透析用剤に適用される日本薬局方一般試験法はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アルコール数測定法"
      },
      {
        "key": 2,
        "text": "エンドキシン試験法"
      },
      {
        "key": 3,
        "text": "重金属試験法"
      },
      {
        "key": 4,
        "text": "制酸力試験法"
      },
      {
        "key": 5,
        "text": "溶出試験法"
      }
    ],
    "correct_answer": 2,
    "explanation": "1　誤\n\nアルコール数測定法は、チンキ剤などのエタノール含有量を測定するための試験法である。\n\n2　正\n\n前記参照。\n\n3　誤\n\n重金属試験法は、医薬品中に混在する重金属の限度試験である。主にエキス剤や流エキス剤に適用される。\n\n4　誤\n\n制酸力試験法は、制酸剤の酸中和能力を評価する試験である。胃酸過多などに用いる薬剤に適用される。\n\n5　誤\n\n溶出試験法は、経口固形製剤（錠剤、カプセル剤など）が規定された溶出試験規格に適合しているかを判定するための試験であり、著しい生物学的非同等性の発生を回避することを目的として実施される。",
    "tags": []
  },
  {
    "id": "r110-053",
    "year": 110,
    "question_number": 53,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "下の模式図で示される経口徐放カプセル剤の型はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "スパンスル型"
      },
      {
        "key": 2,
        "text": "ロンタブ型"
      },
      {
        "key": 3,
        "text": "グラデュメット型"
      },
      {
        "key": 4,
        "text": "スパンタブ型"
      },
      {
        "key": 5,
        "text": "レジネート型"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nロンタブ型は、徐放性内核層を速効性の外層で覆った構造をもつシングルユニット型の経口徐放製剤である。錠剤全体として一定の徐放性を発揮する設計である。\n\n３　誤\n\nグラデュメット型は、多孔性プラスチックの網目構造内に薬物を分散させた構造を持つ、シングルユニット型の経口徐放製剤である。薬物は消化管内で徐々に放出され、マトリックス自体は体外に排泄される。\n\n４　誤\n\nスパンタブ型は、速放性顆粒・徐放性顆粒・腸溶性顆粒を混合し、打錠して成形したマルチプルユニット型の経口徐放製剤である。\n\n５　誤\n\nレジネート型は、薬物をイオン交換樹脂（レジン）に吸着させた構造をもつ、シングルユニット型の経口徐放製剤である。消化管内でナトリウムイオンやカリウムイオンとのイオン交換反応により薬物を徐々に放出する。",
    "tags": [],
    "image_url": "/images/questions/110/q053.png"
  },
  {
    "id": "r110-054",
    "year": 110,
    "question_number": 54,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "薬物の直腸からの吸収改善を図るために用いられている吸収促進剤はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アルギン酸ナトリウム"
      },
      {
        "key": 2,
        "text": "安息香酸ナトリウム"
      },
      {
        "key": 3,
        "text": "カプリン酸ナトリウム"
      },
      {
        "key": 4,
        "text": "チオグリコール酸"
      },
      {
        "key": 5,
        "text": "プロカイン塩酸塩"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n安息香酸ナトリウムは、溶解補助剤として用いられ、難溶性薬物の溶解性を改善する目的で添加される。\n\n３　正\n\nカプリン酸ナトリウムは、吸収促進剤に分類され、主に抗生物質などの直腸からの吸収を促進する目的で利用される。直腸投与製剤において吸収性の向上を図るために添加されることがある。\n\n４　誤\n\nチオグリコール酸は、安定化剤として働き、注射剤中の有効成分の化学的分解を防ぐ目的で使用される。\n\n５　誤\n\nプロカイン塩酸塩は、注射剤の投与時の疼痛を軽減するための無痛化剤（局所麻酔作用）である。",
    "tags": []
  },
  {
    "id": "r110-055",
    "year": 110,
    "question_number": 55,
    "section": "必須",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "レクチンによる認識機構を介した能動的ターゲティングのための修飾基として用いられるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "糖鎖"
      },
      {
        "key": 2,
        "text": "ポリペプチド"
      },
      {
        "key": 3,
        "text": "長鎖不飽和脂肪酸"
      },
      {
        "key": 4,
        "text": "オリゴヌクレオチド"
      },
      {
        "key": 5,
        "text": "ポリエチレングリコール"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-056",
    "year": 110,
    "question_number": 56,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "心筋細胞の壊死を直接起こすことにより、心不全を誘発するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アミオダロン"
      },
      {
        "key": 2,
        "text": "ドキソルビシン"
      },
      {
        "key": 3,
        "text": "エナラプリル"
      },
      {
        "key": 4,
        "text": "ビソプロロール"
      },
      {
        "key": 5,
        "text": "ピオグリタゾン"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-057",
    "year": 110,
    "question_number": 57,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "デキストラン硫酸固定化セルロースを用いた吸着器によるアフェレシス（注）施行中の患者への投与禁忌薬はどれか。１つ選べ。\n\n（注）アフェレシス：生体内のさまざまな血液関連因子を分離・除去して治療する広範囲な医療技術の総称",
    "choices": [
      {
        "key": 1,
        "text": "ニフェジピン"
      },
      {
        "key": 2,
        "text": "エナラプリルマレイン酸塩"
      },
      {
        "key": 3,
        "text": "イルベサルタン"
      },
      {
        "key": 4,
        "text": "エサキセレノン"
      },
      {
        "key": 5,
        "text": "ドキサゾシンメシル酸塩"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-058",
    "year": 110,
    "question_number": 58,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "心房と心室を直接連絡する副伝導路により、心室の早期興奮が生じるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "Adams-Stokes（アダムス・ストークス）症候群"
      },
      {
        "key": 2,
        "text": "Brugada（ブルガダ）症候群"
      },
      {
        "key": 3,
        "text": "QT延長症候群"
      },
      {
        "key": 4,
        "text": "WPW（Wolff-Parkinson-White）症候群"
      },
      {
        "key": 5,
        "text": "洞不全症候群"
      }
    ],
    "correct_answer": 4,
    "explanation": "１　誤\n\nAdams-Stokes（アダムス・ストークス）症候群は、不整脈（完全房室ブロックや心室細動など）によって心拍出量が急激に減少し、一過性の脳虚血発作（失神、けいれんなど）を生じる状態である。\n\n２　誤\n\nBrugada（ブルガダ）症候群は、特徴的なST上昇と心室細動を引き起こす症候群であり、失神や突然死の原因になる。\n\n３　誤\n\nQT延長症候群は、心電図上のQT間隔が延長し、torsades de pointes（多形性心室頻拍）を起こすことで失神や突然死の原因になる。\n\n４　正\n\n５　誤\n\n洞不全症候群は、洞結節の機能障害により、洞停止や徐脈が起きる。房室間の異常伝導ではなく、ペースメーカー部位の機能不全が主因である。",
    "tags": []
  },
  {
    "id": "r110-059",
    "year": 110,
    "question_number": 59,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "急性心筋梗塞の初期治療に用いられるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アスピリン"
      },
      {
        "key": 2,
        "text": "イソプレナリン塩酸塩"
      },
      {
        "key": 3,
        "text": "ダビガトランエテキシラートメタンスルホン酸塩"
      },
      {
        "key": 4,
        "text": "プレドニゾロン"
      },
      {
        "key": 5,
        "text": "プロプラノロール塩酸塩"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-060",
    "year": 110,
    "question_number": 60,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "重症筋無力症で認められる症状はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "突発性発熱"
      },
      {
        "key": 2,
        "text": "前向き健忘"
      },
      {
        "key": 3,
        "text": "聴覚障害"
      },
      {
        "key": 4,
        "text": "振戦"
      },
      {
        "key": 5,
        "text": "構音障害"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-061",
    "year": 110,
    "question_number": 61,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "喀血を生じる疾患はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "気管支拡張症"
      },
      {
        "key": 2,
        "text": "出血性腸炎"
      },
      {
        "key": 3,
        "text": "くも膜下出血"
      },
      {
        "key": 4,
        "text": "胃潰瘍"
      },
      {
        "key": 5,
        "text": "胃食道逆流症"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n気管支拡張症は、慢性的な炎症や感染を繰り返すことで気管支壁の血管が破壊され、喀血が認められる。\n\n２　誤\n\n出血性腸炎は、大腸粘膜が炎症を起こすことで、血便や腹痛が認められる。\n\n３　誤\n\nくも膜下出血は、軟膜とくも膜との間にあるくも膜下腔に出血を起こし、激しい頭痛、悪心・嘔吐、意識障害が認められる。\n\n４　誤\n\n胃潰瘍は、胃粘膜下層以下の組織に欠損が生じることで、胃粘膜から出血するため、吐血、下血が認められる。\n\n５　誤\n\n胃食道逆流症は、胃酸などの胃内容物が食道へ逆流するため、胸やけ、呑酸などの症状が認められる。",
    "tags": []
  },
  {
    "id": "r110-062",
    "year": 110,
    "question_number": 62,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "痛風発作治療薬として最も適切なのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アロプリノール"
      },
      {
        "key": 2,
        "text": "ダパグリフロジン"
      },
      {
        "key": 3,
        "text": "ナプロキセン"
      },
      {
        "key": 4,
        "text": "ラスブリカーゼ"
      },
      {
        "key": 5,
        "text": "クエン酸カリウム・クエン酸ナトリウム"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\nダパグリフロジンは、SGLT-2阻害薬であり、糖尿病、慢性心不全、慢性腎臓病に用いられる。\n\n３　正\n\nナプロキセンは、非ステロイド性抗炎症薬（NSAIDs）であり、痛風発作時の急性炎症や疼痛の軽減に使用される。痛風発作時には、尿酸値を変動させる薬剤（アロプリノールなど）の投与は避け、まずNSAIDsで炎症を抑えることが重要である。\n\n４　誤\n\nラスブリカーゼは、尿酸分解酵素製剤であり、がん化学療法に伴う腫瘍崩壊症候群による高尿酸血症の治療に用いられる。\n\n５　誤\n\nクエン酸カリウム・クエン酸ナトリウムは、尿アルカリ化薬であり、酸性尿の改善を目的に、尿路結石や痛風・高尿酸血症に対して使用される。",
    "tags": []
  },
  {
    "id": "r110-063",
    "year": 110,
    "question_number": 63,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "慢性甲状腺炎の検査所見で陽性になるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "抗ペルオキシダーゼ抗体"
      },
      {
        "key": 2,
        "text": "抗甲状腺刺激ホルモン（TSH）受容体抗体"
      },
      {
        "key": 3,
        "text": "抗グルタミン酸脱炭酸酵素（GAD）抗体"
      },
      {
        "key": 4,
        "text": "抗アセチルコリン受容体抗体"
      },
      {
        "key": 5,
        "text": "抗環状シトルリン化ペプチド（CCP）抗体"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n前記参照\n\n２　誤\n\n抗甲状腺刺激ホルモン（TSH）受容体抗体は、バセドウ病に特異的な自己抗体である。\n\n３　誤\n\n抗グルタミン酸脱炭酸酵素（GAD）抗体は、1型糖尿病で認められる自己抗体である。\n\n４　誤\n\n抗アセチルコリン受容体抗体は、重症筋無力症に特異的な自己抗体である。\n\n５　誤\n\n抗環状シトルリン化ペプチド（CCP）抗体は、関節リウマチにおいて高い特異度を示す自己抗体である。",
    "tags": []
  },
  {
    "id": "r110-064",
    "year": 110,
    "question_number": 64,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "シクロスポリン点眼液が使用される眼疾患はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "白内障"
      },
      {
        "key": 2,
        "text": "春季カタル"
      },
      {
        "key": 3,
        "text": "感染性角膜炎"
      },
      {
        "key": 4,
        "text": "加齢黄斑変性"
      },
      {
        "key": 5,
        "text": "緑内障"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-065",
    "year": 110,
    "question_number": 65,
    "section": "必須",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "空気感染が主な伝播経路となるウイルス感染症はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "麻しん"
      },
      {
        "key": 2,
        "text": "風しん"
      },
      {
        "key": 3,
        "text": "HIV感染症"
      },
      {
        "key": 4,
        "text": "流行性耳下腺炎（ムンプス）"
      },
      {
        "key": 5,
        "text": "インフルエンザ"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n風しんの原因となる風しんウイルスは、主に飛沫感染により伝播する。\n\n３　誤\n\nHIV感染症の原因となるヒト免疫不全ウイルス（HIV）は、主に血液、体液などを介して伝播する。\n\n４　誤\n\n流行性耳下腺炎（ムンプス）の原因となるムンプスウイルスは、主に飛沫感染により伝播する。\n\n５　誤\n\nインフルエンザの原因となるインフルエンザウイルスは、主に飛沫感染により伝播する。",
    "tags": []
  },
  {
    "id": "r110-066",
    "year": 110,
    "question_number": 66,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "播種性血管内凝固症候群（DIC）で認められる検査所見はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アンチトロンビンの減少"
      },
      {
        "key": 2,
        "text": "フィブリノゲン・フィブリン分解産物（FDP）の減少"
      },
      {
        "key": 3,
        "text": "血小板数の増加"
      },
      {
        "key": 4,
        "text": "プラスミノゲンの増加"
      },
      {
        "key": 5,
        "text": "プロトロンビン時間（PT）の短縮"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nDICでは、過剰に血栓が形成されるため、血栓を溶解するためにアンチトロンビンが消費され、減少する。\n\n２　誤\n\nDICでは、血栓の溶解が活性化するため、フィブリノゲン・フィブリン分解産物（FDP）が増加する。\n\n３　誤\n\nDICでは、血栓形成に伴い血小板は消費され、低下する。\n\n４　誤\n\nDICでは、線溶系が亢進するため、プラスミノゲンは消費され、減少する。\n\n５　誤\n\nDICでは、血栓形成に伴い外因系凝固因子が消費されるため、プロトロンビン時間は延長する。",
    "tags": []
  },
  {
    "id": "r110-067",
    "year": 110,
    "question_number": 67,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "特発性肺線維症の治療に用いられるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アベマシクリブ"
      },
      {
        "key": 2,
        "text": "インターフェロン アルファ"
      },
      {
        "key": 3,
        "text": "ゲフィチニブ"
      },
      {
        "key": 4,
        "text": "ピルフェニドン"
      },
      {
        "key": 5,
        "text": "ブレオマイシン"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-068",
    "year": 110,
    "question_number": 68,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "胆石症の疝痛発作時に、疼痛緩和のために使用される薬物として最も適切なのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ウルソデオキシコール酸"
      },
      {
        "key": 2,
        "text": "エストラジオール"
      },
      {
        "key": 3,
        "text": "ブチルスコポラミン臭化物"
      },
      {
        "key": 4,
        "text": "ベザフィブラート"
      },
      {
        "key": 5,
        "text": "モルヒネ塩酸塩"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-069",
    "year": 110,
    "question_number": 69,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "以下の医薬品情報源のうち、一次資料はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ガイドライン"
      },
      {
        "key": 2,
        "text": "索引誌"
      },
      {
        "key": 3,
        "text": "医薬品インタビューフォーム"
      },
      {
        "key": 4,
        "text": "原著論文"
      },
      {
        "key": 5,
        "text": "医薬品添付文書"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-070",
    "year": 110,
    "question_number": 70,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "レジオネラ肺炎に対して最も有効性が期待できる抗菌薬はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "シプロフロキサシン"
      },
      {
        "key": 2,
        "text": "タゾバクタム・ピペラシリン"
      },
      {
        "key": 3,
        "text": "メロペネム"
      },
      {
        "key": 4,
        "text": "アミカシン"
      },
      {
        "key": 5,
        "text": "バンコマイシン"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-071",
    "year": 110,
    "question_number": 71,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "薬剤師が2年ごとに厚生労働大臣に届け出なければならない事項はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "個人番号（マイナンバー）"
      },
      {
        "key": 2,
        "text": "住所"
      },
      {
        "key": 3,
        "text": "認定薬剤師の資格"
      },
      {
        "key": 4,
        "text": "薬剤師国家試験合格の年"
      },
      {
        "key": 5,
        "text": "再教育研修の受講の有無"
      }
    ],
    "correct_answer": 2,
    "explanation": "【届出の必要がある項目】\n\n・氏名\n\n・住所\n\n・性別\n\n・生年月日\n\n・薬剤師名簿登録番号\n\n・薬剤師名簿登録年月日\n\n・従事している施設および業務の種別（例：薬局、病院、診療所、大学、製薬企業など）\n\n・従事先の名称および所在地",
    "tags": []
  },
  {
    "id": "r110-072",
    "year": 110,
    "question_number": 72,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "医薬品医療機器等法において、「薬局医薬品」とは、「要指導医薬品及び【A】以外の医薬品をいう。」となっている。Aにあってはまるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "医療用医薬品"
      },
      {
        "key": 2,
        "text": "処方箋医薬品"
      },
      {
        "key": 3,
        "text": "一般用医薬品"
      },
      {
        "key": 4,
        "text": "体外診断用医薬品"
      },
      {
        "key": 5,
        "text": "薬局製造販売医薬品"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-073",
    "year": 110,
    "question_number": 73,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "医薬品の製造販売承認申請のための一般毒性試験を実施する際に、遵守しなければならないのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "GCP"
      },
      {
        "key": 2,
        "text": "GLP"
      },
      {
        "key": 3,
        "text": "GMP"
      },
      {
        "key": 4,
        "text": "GQP"
      },
      {
        "key": 5,
        "text": "GVP"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nGCP（Good Clinical Practice：医薬品の臨床試験の実施に係る基準）は、被験者の人権の保護、安全の保持及び福祉の向上を図り、治験の科学的な質及び成績の信頼性を確保するための基準である\n\n２　正\n\n前記参照\n\n３　誤\n\nGMP（Good Manufacturing Practice：医薬品及び医薬部外品の製造管理及び品質管理の基準）は、医薬品の品質確保のため、製造に当たって、原料の受け入れから最終製品の出荷にいたる全工程について、間違いのない品質の製品を製造するための基準である。\n\n４　誤\n\nGQP（医薬品、医薬部外品、化粧品及び再生医療等製品の品質管理の基準）は、医薬品等の製造販売業者が製品の出荷時及び出荷後における品質管理を適正に実施するための基準である。\n\n５　誤\n\nGVP（医薬品、医薬部外品、化粧品、医療機器及び再生医療等製品の製造販売後安全管理の基準）は、医薬品等の製造販売業者がその品質、有効性及び安全性に関する事項や、適正使用のための必要な情報の収集、検討及びその結果に基づく必要な措置に関して遵守すべき事項を定めている。",
    "tags": []
  },
  {
    "id": "r110-074",
    "year": 110,
    "question_number": 74,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "毒物劇物営業者が行う劇物の容器及び被包への表示について、「医薬用外」の文字に加えて表示する内容として正しいのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "白地に赤色をもって「劇」の文字"
      },
      {
        "key": 2,
        "text": "白地に黒色をもって「劇」の文字"
      },
      {
        "key": 3,
        "text": "白地に赤色をもって「劇物」の文字"
      },
      {
        "key": 4,
        "text": "赤地に白色をもって「劇物」の文字"
      },
      {
        "key": 5,
        "text": "白地に黒色をもって「劇物」の文字"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-075",
    "year": 110,
    "question_number": 75,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "医薬品副作用被害救済制度の概要を示した下図において、健康被害者が給付を請求する先の【A】として正しいのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "主治医"
      },
      {
        "key": 2,
        "text": "都道府県知事"
      },
      {
        "key": 3,
        "text": "製造販売業者"
      },
      {
        "key": 4,
        "text": "社会保険診療報酬支払基金"
      },
      {
        "key": 5,
        "text": "独立行政法人医薬品医療機器総合機構（PMDA）"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q075.png"
  },
  {
    "id": "r110-076",
    "year": 110,
    "question_number": 76,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "評価療養の対象となるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "出産に係る診療"
      },
      {
        "key": 2,
        "text": "医薬品の治験に係る診療"
      },
      {
        "key": 3,
        "text": "特別の療養環境（差額ベッド）"
      },
      {
        "key": 4,
        "text": "予約診療"
      },
      {
        "key": 5,
        "text": "紹介状なしでの特定機能病院の初診"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-077",
    "year": 110,
    "question_number": 77,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "介護保険法において、第2号被保険者が要介護認定を受けられる特定疾患に該当するのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "関節リウマチ"
      },
      {
        "key": 2,
        "text": "結核"
      },
      {
        "key": 3,
        "text": "C型肝炎"
      },
      {
        "key": 4,
        "text": "高血圧症"
      },
      {
        "key": 5,
        "text": "脂質異常症"
      }
    ],
    "correct_answer": 1,
    "explanation": "第2号被保険者が要介護・要支援認定を受けるには、加齢に伴って起こることが推定される特定疾病に罹患している必要がある。\n\n【主な特定疾病】\n\n　末期がん、骨折を伴う骨粗鬆症、関節リウマチ、パーキンソン病、初老期における認知症",
    "tags": []
  },
  {
    "id": "r110-078",
    "year": 110,
    "question_number": 78,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "世界医師会総会にて採択された、ヒポクラテスの誓いを現代化したものであるジュネーブ宣言の根幹となるのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "患者の権利"
      },
      {
        "key": 2,
        "text": "生命倫理の4原則"
      },
      {
        "key": 3,
        "text": "医師の遵守すべき倫理"
      },
      {
        "key": 4,
        "text": "非人道的な人体実験の実施条件"
      },
      {
        "key": 5,
        "text": "人を対象とした医学研究の倫理的原則"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n「生命倫理の4原則」は、ベルモントレポートに基づく「人格の尊重」「善行」「正義」の3原則に、「無危害」の考えを加えたもので、現代の医療倫理に広く応用されている。\n\n３　正\n\nジュネーブ宣言は、1948年に世界医師会によって採択された医師の倫理宣言であり、ヒポクラテスの誓いを現代化した内容を含んでいる。\n\n４　誤\n\n人体実験の倫理規範として、ニュルンベルク綱領がある。この綱領は、ナチス・ドイツによる強制的な医学実験に対する裁判（ニュルンベルク裁判）を通じて策定されたものである。\n\n５　誤\n\n「人を対象とした医学研究の倫理原則」は、1964年に採択されたヘルシンキ宣言に基づいている。この宣言は、医学研究における被験者の安全・人権の保護を重視しており、わが国のGCP（Good Clinical Practice）にもその理念が取り入れられている。",
    "tags": []
  },
  {
    "id": "r110-079",
    "year": 110,
    "question_number": 79,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "汚染されたヒト乾燥硬膜の使用により感染した疾患であって、生物由来製品感染等被害救済制度の創設の契機となったのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "成人T細胞白血病"
      },
      {
        "key": 2,
        "text": "クロイツフェルト・ヤコブ病"
      },
      {
        "key": 3,
        "text": "トキソプラズマ症"
      },
      {
        "key": 4,
        "text": "大腿四頭筋短縮症"
      },
      {
        "key": 5,
        "text": "後天性免疫不全症候群"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-080",
    "year": 110,
    "question_number": 80,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "コミュニケーションを円滑にするため取り入れる傾聴の技能や態度として、適切なのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ブロッキング"
      },
      {
        "key": 2,
        "text": "ミラーリング"
      },
      {
        "key": 3,
        "text": "エンコーディング"
      },
      {
        "key": 4,
        "text": "パターナリズム"
      },
      {
        "key": 5,
        "text": "デコーディング"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\nミラーリング（mirroring）は、相手の身振りや表情、話し方などをさりげなく真似ることで、無意識のうちに相手との一体感や安心感を生み出す技法である。傾聴の場面において、信頼関係を築くための基本的な態度のひとつとされている。\n\n３　誤\n\nエンコーディング（encoding）は、伝えたい内容を言語や非言語の形に変換する過程であり、情報の話し手の行為を意味する。これは傾聴という受け手側のスキルとは関係がない。\n\n４　誤\n\nパターナリズム（paternalism）とは、医療者が「患者のため」として本人の意思を尊重せずに判断・行動する態度を指す。傾聴とは反対の方向性にある考え方であり、自己決定の尊重や共感的理解を重視する傾聴には適さない。\n\n５　誤\n\nデコーディング（decoding）は、受け取った情報を理解・解釈するプロセスであり、情報の受け手の行為を意味する。これは主に情報伝達の技術的モデルで用いられる用語であり、傾聴の態度や技能を示す語ではない。",
    "tags": []
  },
  {
    "id": "r110-081",
    "year": 110,
    "question_number": 81,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "以下の成分を含む一般用医薬品を使用した場合に、出血傾向に最も注意が必要なのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "センノシド"
      },
      {
        "key": 2,
        "text": "ロペラミド塩酸塩"
      },
      {
        "key": 3,
        "text": "ミノキシジル"
      },
      {
        "key": 4,
        "text": "フェキソフェナジン塩酸塩"
      },
      {
        "key": 5,
        "text": "イコサペント酸エチル"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-082",
    "year": 110,
    "question_number": 82,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "通常、食前に摂取する薬剤はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "セレコキシブ錠"
      },
      {
        "key": 2,
        "text": "イマチニブメシル酸塩錠"
      },
      {
        "key": 3,
        "text": "メナテトレノンカプセル"
      },
      {
        "key": 4,
        "text": "エパルレスタット錠"
      },
      {
        "key": 5,
        "text": "イトラコナゾールカプセル"
      }
    ],
    "correct_answer": 4,
    "explanation": "２　誤\n\nイマチニブメシル酸塩錠は、チロシンキナーゼ阻害薬であり、通常1日1回食後に経口投与する。\n\n３　誤\n\nメナテトレノンカプセルは、ビタミンK2製剤であり、通常1日3回食後に経口投与する。\n\n４　正\n\nエパルレスタット錠は、アルドース還元酵素阻害薬であり、通常1日3回毎食前に経口投与する。\n\n５　誤\n\nイトラコナゾールカプセルは、抗真菌薬であり、通常1日1または２回食直後に経口投与する。",
    "tags": []
  },
  {
    "id": "r110-083",
    "year": 110,
    "question_number": 83,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "居宅療養管理指導をしている患者のケアプラン作成において、薬剤師が情報提供しなければならない職種はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "介護福祉士"
      },
      {
        "key": 2,
        "text": "介護支援専門員"
      },
      {
        "key": 3,
        "text": "生活相談員"
      },
      {
        "key": 4,
        "text": "社会福祉士"
      },
      {
        "key": 5,
        "text": "訪問介護員"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n介護福祉士は、専門的な知識と技術を活かして、身体介護や生活支援を行う。\n\n２　正\n\n前記参照\n\n３　誤\n\n生活相談員は、介護福祉施設等で利用者や家族の相談対応を行う。\n\n４　誤\n\n社会福祉士は、心身の障害や生活困難を抱える人の相談に応じ、必要な支援や助言を行う。\n\n５　誤\n\n訪問介護員（ホームヘルパー）は、利用者宅での入浴・排泄・食事などの介助や生活支援を担う。",
    "tags": []
  },
  {
    "id": "r110-084",
    "year": 110,
    "question_number": 84,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "災害派遣医療チーム（DMAT）が最も優先すべき活動はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "広域医療搬送対象患者の選出"
      },
      {
        "key": 2,
        "text": "心的外傷後ストレス障害（PTSD）の診療"
      },
      {
        "key": 3,
        "text": "長期的な医療支援"
      },
      {
        "key": 4,
        "text": "一般用医薬品の販売"
      },
      {
        "key": 5,
        "text": "被災地の復興支援"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-085",
    "year": 110,
    "question_number": 85,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "透析療法を受けている患者への販売を避けるべき一般用医薬品の成分はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ロペラミド塩酸塩"
      },
      {
        "key": 2,
        "text": "テプレノン"
      },
      {
        "key": 3,
        "text": "乾燥酵母"
      },
      {
        "key": 4,
        "text": "トリメブチンマレイン酸塩"
      },
      {
        "key": 5,
        "text": "スクラルファート"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-086",
    "year": 110,
    "question_number": 86,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "以下のうち、学校薬剤師の職務はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "保健室内での調剤"
      },
      {
        "key": 2,
        "text": "救急時の一般用医薬品の販売"
      },
      {
        "key": 3,
        "text": "ワクチンの投与"
      },
      {
        "key": 4,
        "text": "校内土壌の放射能汚染検査"
      },
      {
        "key": 5,
        "text": "薬物乱用防止のための教育"
      }
    ],
    "correct_answer": 5,
    "explanation": "【学校薬剤師の主な職務】\n\n・薬物乱用防止の教育\n\n・飲料水・空気・プール水の検査\n\n・環境衛生の管理・改善指導\n\n・医薬品適正使用のための教育など",
    "tags": []
  },
  {
    "id": "r110-087",
    "year": 110,
    "question_number": 87,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "周術期の患者において血栓症のリスクが最も高い薬剤はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "メトホルミン塩酸塩錠"
      },
      {
        "key": 2,
        "text": "サクビトリルバルサルタンナトリウム水和物錠"
      },
      {
        "key": 3,
        "text": "ダパグリフロジンプロピレングリコール錠"
      },
      {
        "key": 4,
        "text": "ドロスピレノン・エチニルエストラジオール錠"
      },
      {
        "key": 5,
        "text": "セマグルチド錠"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-088",
    "year": 110,
    "question_number": 88,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "以下のうち、Common Terminology Criteria for Adverse Events（CTCAE）が用いられる指標として適切なのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "医薬品自主回収時の健康危険度"
      },
      {
        "key": 2,
        "text": "インシデント発生時の患者への影響度分類レベル"
      },
      {
        "key": 3,
        "text": "医薬品・医療機器等安全性情報の緊急度"
      },
      {
        "key": 4,
        "text": "医薬品による有害事象の重症度"
      },
      {
        "key": 5,
        "text": "患者の日常生活における制限の程度"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-089",
    "year": 110,
    "question_number": 89,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "以下のうち、医薬品による副作用が疑われる症例について、医薬関係者が報告する医薬品安全性情報報告書への記載項目はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "患者の生年月日"
      },
      {
        "key": 2,
        "text": "患者氏名"
      },
      {
        "key": 3,
        "text": "副作用の発現期間"
      },
      {
        "key": 4,
        "text": "家族の副作用歴"
      },
      {
        "key": 5,
        "text": "被疑薬の製造番号"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-090",
    "year": 110,
    "question_number": 90,
    "section": "必須",
    "subject": "実務",
    "category": "",
    "question_text": "腫瘍崩壊症候群の予防に用いられる薬剤はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ウルソデオキシコール酸錠"
      },
      {
        "key": 2,
        "text": "フェブキソスタット錠"
      },
      {
        "key": 3,
        "text": "メトトレキサート錠"
      },
      {
        "key": 4,
        "text": "ラモセトロン塩酸塩錠"
      },
      {
        "key": 5,
        "text": "タクロリムス錠"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-091",
    "year": 110,
    "question_number": 91,
    "section": "理論",
    "subject": "物理",
    "category": "",
    "question_text": "理想気体からなる閉じた系における熱力学第一法則に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "定温過程において、系に加えられた熱量はすべて系がする仕事になる。"
      },
      {
        "key": 2,
        "text": "内部エネルギー変化は、系に加えられた熱量と系が外界からされた仕事の和で表される。"
      },
      {
        "key": 3,
        "text": "断熱過程において、系の体積が増加すると内部エネルギーも増加する。"
      },
      {
        "key": 4,
        "text": "内部エネルギー変化は経路関数である熱と仕事からなり、それ自体も経路関数である。"
      },
      {
        "key": 5,
        "text": "系が外界に対してする仕事は、不可逆過程の方が可逆過程より大きい。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　正\n\n熱力学第一法則はエネルギー保存則に基づいており、孤立系ではエネルギーの出入りがなければ増減しない。内部エネルギーの変化（ΔU）は、系に加えられた熱（q）と系がした仕事（w）の和で表され、ΔU＝q＋w が成り立つ。\n\n３　誤\n\n断熱過程では、系と外部との間で熱のやり取りがないため q＝0 となり、ΔU＝q＋w＝w が成り立つ。また、w＝－pΔV であることから、ΔU＝－pΔV が導かれる。体積が増加すると ΔV＞0 であるため、ΔU＜0 となり、内部エネルギーは減少する。\n\n４　誤\n\n内部エネルギー変化（ΔU）は、初期状態と最終状態のみによって決まり、経路に依存しない状態関数である。\n\n５　誤\n\n可逆過程は、エネルギーの損失がない理想的な過程であり、外部に対して最大限の仕事を行うことができる。それに対して、不可逆過程では摩擦などによるエネルギー損失が生じるため、外界に対する仕事量は可逆過程よりも小さくなる。\n\n定圧過程・定容過程・等温過程・断熱過程\n\n熱力学第一法則",
    "tags": []
  },
  {
    "id": "r110-092",
    "year": 110,
    "question_number": 92,
    "section": "理論",
    "subject": "物理",
    "category": "",
    "question_text": "ファントホッフプロットは直線を示す。このことに関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "温度の逆数に対して平衡定数の対数をプロットしたものである。"
      },
      {
        "key": 2,
        "text": "切片から標準反応エンタルピーが求まる。"
      },
      {
        "key": 3,
        "text": "傾きから標準反応エントロピーが求まる。"
      },
      {
        "key": 4,
        "text": "吸熱反応のとき、傾きは負である。"
      },
      {
        "key": 5,
        "text": "傾きが正のとき、温度が上がるにつれて平衡定数は大きくなる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nファントホッフプロットは、縦軸に平衡定数の自然対数（lnK）、横軸に絶対温度の逆数（1/T）をプロットしたものであり、温度変化に伴う、平衡定数の変化を示している。\n\n２　誤\n\n切片がΔS°/R であることから、切片より標準反応エントロピーが得られる。\n\n３　誤\n\n傾きが－ΔH°／Rであることから、 傾きより標準反応エンタルピーが得られる。\n\n４　正\n\n吸熱反応では、ΔH°＞0となることから、傾きは負となる。\n\n５　誤\n\n傾きが正のとき（ΔH°＜0、発熱反応）、温度が上がると1/Tは小さくなるため、lnKは減少し、結果として平衡定数Kも小さくなる。",
    "tags": []
  },
  {
    "id": "r110-093",
    "year": 110,
    "question_number": 93,
    "section": "理論",
    "subject": "物理",
    "category": "",
    "question_text": "問 93        ボルツマン分布は、異なるエネルギー準位 E 1、E 2（E 2 2 E 1）にある分子の数\nをそれぞれ N 1、N 2 としたとき、熱平衡状態における両者の比（R = N 2/N 1）とエ\nネルギー差（DE = E 2 - E 1）との間にある一定の関係を与える。この関係を表す\nグラフの概形として正しいのはどれか。1つ選べ。\n1                   2                3\n₁                  ₁                ₁\nR                  R                R\n₀    DE            ₀       DE       ₀   DE\n4                   5\n₁                  ₁\nR                  R\n₀    DE            ₀       DE",
    "choices": [],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q093.png"
  },
  {
    "id": "r110-094",
    "year": 110,
    "question_number": 94,
    "section": "理論",
    "subject": "物理",
    "category": "",
    "question_text": "次の酵素反応の反応速度vはミカエリス・メンテンの式に従う。\nE ＋ S ⇄ ES → P\nただし、Eは酵素、Sは基質、ESはEとSの複合体、Pは生成物を表し、ミカエリス定数をKm、最大反応速度をVmaxとする。この反応に関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "vは、Pの生成速度（d［P］/dt）で表される。"
      },
      {
        "key": 2,
        "text": "vは、［ES］が一定（d［ES］/dt＝0）となる定常状態を仮定した場合の速度である。"
      },
      {
        "key": 3,
        "text": "［S］がKmの2倍であるとき、vはVmaxの1/4となる。"
      },
      {
        "key": 4,
        "text": "Kmは反応温度に依存しない。"
      },
      {
        "key": 5,
        "text": "Kmが小さいほどEとSの親和性は低い。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　正\n\nミカエリス・メンテン式は、「酵素–基質複合体（ES）」が一定であるという仮定（定常状態仮定）に基づいた式である。\n\n３　誤\n\n［S］がKmの2倍であるとき、vはVmaxの2/3となる。\n\n４　誤\n\nKmは以下の①式で表され、k1、k－1、k 2が温度により変化するため、Kmは反応温度に依存する。\n\n５　誤\n\nKmは、酵素と基質の解離の度合いを表すため、Kmが小さいほどEとSの親和性は高い。",
    "tags": []
  },
  {
    "id": "r110-095",
    "year": 110,
    "question_number": 95,
    "section": "理論",
    "subject": "物理",
    "category": "",
    "question_text": "放射性医薬品に汎用されるテクネチウム99mTcは、99Moから放射平衡を利用してジェネレーターにより得られる。このことに関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "放射平衡は、親核種の半減期が娘核種の半減期より十分長いときに成り立つ。"
      },
      {
        "key": 2,
        "text": "99Moと99mTcの間には永続平衡が成り立つ。"
      },
      {
        "key": 3,
        "text": "99mTcの壊変形式は核異性体転移である。"
      },
      {
        "key": 4,
        "text": "カラムから未壊変の99Moを溶出する方法をミルキングという。"
      },
      {
        "key": 5,
        "text": "カラムの担体には微量のTlを含むNaIの単結晶を用いる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n99Moの半減期は約66時間、99mTcの半減期は約6時間であり、その比が約10倍である。このように、親核種と娘核種の半減期に明確な差があるときは、過渡平衡が成り立つ。\n\n３　正\n\n 99mTcは、99Tcと同じ元素・同じ質量数であるが、励起状態（エネルギーが高い）にある核異性体である。この99mTcは、γ線を放出して基底状態の99Tcに変化する。このような変化を核異性体転移という。\n\n４　誤\n\nミルキング（milking）とは、ジェネレーターから半減期の短い娘核種（99mTcなど）を溶出する操作のことである。\n\n５　誤\n\n99Mo-99mTcジェネレーターにおいて、カラムの担体にはアルミナ（Al2O3）が一般的に用いられる。なお、Tl（タリウム）を添加したNaIの単結晶は、γ線の検出用のシンチレーションカウンタで用いられる。",
    "tags": []
  },
  {
    "id": "r110-096",
    "year": 110,
    "question_number": 96,
    "section": "理論",
    "subject": "化学",
    "category": "",
    "question_text": "28%アンモニア水を量り、水で全量500mLとした後、その20mLを正確に量り、さらに水で全量1000mLとした。この水溶液のpHを測定したところ、11.0であった。28％アンモニア水の採取量に最も近いのはどれか。１つ選べ。\n\n　ただし、28％アンモニア水の比重d＝0.90、アンモニアの分子量NH3=17、アンモニアの塩基解離定数Kb＝1.7×10－5mol/L、水のイオン積［H＋］［OH－］＝1.0×10－14（mol/L）2、1.01/2から1.11/2の範囲の値は１とし、温度は25℃とする。",
    "choices": [
      {
        "key": 1,
        "text": "10mL"
      },
      {
        "key": 2,
        "text": "20mL"
      },
      {
        "key": 3,
        "text": "50mL"
      },
      {
        "key": 4,
        "text": "100mL"
      },
      {
        "key": 5,
        "text": "200mL"
      }
    ],
    "correct_answer": 4,
    "explanation": "ステップ２：［OH－］からアンモニアのモル濃度を求める。\n\nアンモニアは弱塩基であるため、［OH－］を①式より求めることができる。\n\n［OH－］＝（Kb・C）1/2…①\n\n①式に［OH－］＝10－3mol/L及びKb＝1.7×10－5mol/Lを代入すると、\n\n10－3＝（1.7×10－5・C）1/2\n\n両辺を2乗して\n\n10－6＝1.7×10－5・C\n\nC≒0.059 mol/L　\n\nステップ3：最終的に調整した1000mL中のNH3量を求める。\n\n0.059 mol/L×1000mL＝0.059mol\n\nステップ4：最初に作成した500 mL中に含まれるNH3量を求める。\n\n　再希釈後の1000 mL溶液中には 0.059 mol のNH3が含まれている。\n\n　この1000 mLは、500 mL溶液から取り出した20 mLを希釈して作成したものである。\n\n　20 mLあたり0.059 mol含まれるということは、500 mL中にはその25倍の量である1.475 mol （0.059 mol × 25）のNH3が含まれていたことになる。\n\nステップ5：28%アンモニア水の濃度をmol",
    "tags": []
  },
  {
    "id": "r110-097",
    "year": 110,
    "question_number": 97,
    "section": "理論",
    "subject": "化学",
    "category": "",
    "question_text": "次の記述は、X線造影剤として用いられる日本薬局方アミドトリゾ酸（C11H9I3N2O4：613.91）の純度試験と定量法に関するものである。\n純度試験\n\n　芳香族第一アミン　本品0.20gをとり、水5mL及び水酸化ナトリウム試液1mLを加えて溶かし、亜硝酸ナトリウム溶液（1→100）4mL及び1mol/L塩酸試液10mLを加えて振り混ぜ、2分間放置する。次にアミド硫酸アンモニウム試液5mLを加えてよく振り混ぜ、1分間放置した後、1-ナフトールのエタノール（95）溶液（1→10）0.4 mL、水酸化ナトリウム試液 15 mL 及び水を加えて正確に 50 mL とする。この液につき、同様に操作して得た空試験法を対照とし、紫外可視吸光度測定により試験を行うとき、波長485nmにおける吸光度は0.15以下である。\n定量法\n\n　本品約0.5gを精密に量り、けん化フラスコに入れ、水酸化ナトリウム試液40mLに溶かし、亜鉛粉末1gを加え、還流冷却器を付けて30分間煮沸し、冷後、ろ過する。フラスコ及びろ紙を水50mLで洗い、洗液は先のろ液に合わせる。この液に酢酸（100）5mLを加え、ア0.1 mol/L 硝酸銀液で滴定する（指示薬：イテトラブロモフェノールフタレインエチルエステル試液1 mL）。ただし、滴定の終点は沈殿の黄色が「　ウ　」に変わるときとする。\n0.1 mol/L 硝酸銀液 1 mL ＝「　エ　」mg C11H9I3N2O4\n問97\n\n　純度試験の操作を行って得られる芳香族第一アミンの許容限度に最も近いのはどれか。１つ選べ。ただし、芳香族第一アミンの本操作による呈色物の比吸光度E1%1cm（485nm）は475、層長は1cmとする。",
    "choices": [
      {
        "key": 1,
        "text": "0.040％"
      },
      {
        "key": 2,
        "text": "0.079%"
      },
      {
        "key": 3,
        "text": "0.16%"
      },
      {
        "key": 4,
        "text": "0.79%"
      },
      {
        "key": 5,
        "text": "1.58%"
      }
    ],
    "correct_answer": 2,
    "explanation": "ここで、A：吸光度、C：溶液の濃度（g／100mL）、l：光路長（cm）\n\nまず、アミドトリゾ酸0.20g中に含まれる芳香族第一アミンの量（g）をxとする。測定では、この試料に水と試薬を加えたうえで全量を50mLに調製し、吸光度を測定している。比吸光度では、100mLあたりの濃度として扱うため、C＝x /50mL＝2x/100mLとなる。\n\nまた、「吸光度は0.15以下」と規定されていることから、A＝0.15と設定する。さらに、比吸光度E1%1cm＝475、光路長l＝1cmを①式を代入すると、xを下記のように計算することができる。\n\nよって、アミドトリゾ酸0.20g中に含まれてよい芳香族第一級アミンの最大量は0.000158gであり、芳香族第一アミンの許容限度は、0.000158g÷0.20g≒0.079%となる。",
    "tags": [],
    "image_url": "/images/questions/110/q097.png"
  },
  {
    "id": "r110-099",
    "year": 110,
    "question_number": 99,
    "section": "理論",
    "subject": "化学",
    "category": "",
    "question_text": "日本薬局方金チオリンゴ酸ナトリウムの定量法には原子吸光光度法が用いられる。このことに関する記述として正しいのはどれか。２つ選べ。なお、測定条件は以下のとおりである。\n測定条件\n\n使用ガス：可燃性ガス［　ア　］\n\n支燃性ガス　空気\nランプ：［　イ　］（波長242.8nm）",
    "choices": [
      {
        "key": 1,
        "text": "［　ア　］に入るのは、アセチレンである。"
      },
      {
        "key": 2,
        "text": "［　イ　］に入るのは、重水素放電管である。"
      },
      {
        "key": 3,
        "text": "原子化には冷蒸気方式が用いられる。"
      },
      {
        "key": 4,
        "text": "定量には、ランベルト・ベール（Lambert-Beer）の法則が適用される。"
      },
      {
        "key": 5,
        "text": "金の原子スペクトルは、連続スペクトルである。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n「イ」に入るのは、金中空陰極ランプである。\n\n原子吸光光度法では、通常、中空陰極ランプが光源として用いられ、陰極には測定対象元素（金を含有する医薬品を測定する際：金）が含まれている。重水素放電管は紫外可視吸光度測定法で用いられる紫外線を放出する光源である。\n\n３　誤\n\n本設問では、可燃性ガスおよび支燃性ガスの使用が示されているため、原子化には「フレーム方式（火炎による原子化）」が採用されていると推測される。冷蒸気方式は、水銀の測定などで用いられる方法である。\n\n４　正\n\n原子吸光光度法においては、ランベルト・ベールの法則が適用される。\n\nこの法則は「希薄溶液では、吸光度は濃度と層長に比例する」という法則であり、吸光現象を利用した定量において基本となる法則である。\n\n５　誤\n\n金の原子スペクトルは、線（輝線）スペクトルである。\n\n原子が励起状態から基底状態に戻る際に特定波長の光（輝線）を放出するため、連続スペクトルではなく線（輝線）スペクトルを示す。",
    "tags": []
  },
  {
    "id": "r110-100",
    "year": 110,
    "question_number": 100,
    "section": "理論",
    "subject": "化学",
    "category": "",
    "question_text": "フェノール、パラオキシ安息香酸及びトルエンを含む混合物試料を高速液体クロマトグラフィー（HPLC）により分析した。このことに関する記述として正しいのはどれか。2つ選べ。なお、HPLCの分析条件は以下のとおりである。\n分析条件\n\n検出器：紫外吸光光度計（測定波長：270 nm）\n\nカラム：内径 4.6 mm、長さ15 cm のステンレス管に粒径5μmの液体クロマトグラフィー用オクタデシルシリル化シリカゲルを充てんする。\n\nカラム温度：35 ℃付近の一定温度\n\n移動相：pH 7.0 の 0.1 mol/Lリン酸緩衝液／メタノール（3：1）混液",
    "choices": [
      {
        "key": 1,
        "text": "使用したHPLCは順相クロマトグラフィーである。"
      },
      {
        "key": 2,
        "text": "3つの化合物のうち、最後に溶出するのはトルエンである。"
      },
      {
        "key": 3,
        "text": "カラム温度を高くするとピーク高さは大きくなり、ピーク面積は減少する。"
      },
      {
        "key": 4,
        "text": "パラオキシ安息香酸の保持時間を長くするには、移動相中の緩衝液のpHを低くする。"
      },
      {
        "key": 5,
        "text": "トルエンの保持時間を長くするために、移動相中のメタノールの比率を高くする。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\nオクタデシルシリル化シリカゲルは、極性が低いため、極性の低い試料と親和性が高い。芳香環は疎水基であり、結合する置換基により極性が異なる。炭素が結合するほど極性は低くなり、それに対して、極性基であるカルボキシ基やヒドロキシ基が結合すると極性が高くなる。よって、極性はパラオキシ安息香酸＞フェノール＞トルエンの順に低くなる。混合物試料のうち、トルエンが最も極性が低いため、オクタデシルシリル化シリカゲル（固定相）に最も強く保持されるため、最後に溶出する。\n\n３　誤\n\nカラム温度の上昇により試料の移動速度が速くなるため、保持時間は短くなり、バンドの広がりも抑えられる。その結果、ピーク高さは大きくなるが、ピーク面積は試料の量に比例するため、温度変化によってピーク面積が減少することはない。\n\n４　正\n\nパラオキシ安息香酸は酸性物質であり、pHを低くすると非電離型（分子形）が増加する。分子形は極性が低いため、極性が低い固定相に強く保持されるようになり、保持時間が長くなる。\n\n５　誤\n\n移動相中のメタノールの比率を増やすと、移動相全体の極性が低下する。その結果、極性が低いトルエンは移動相により",
    "tags": []
  },
  {
    "id": "r110-101",
    "year": 110,
    "question_number": 101,
    "section": "理論",
    "subject": "生物",
    "category": "",
    "question_text": "問 101       有機化合物Ａ～Ｄが ₁₀₀ mg ずつ含まれるジエチルエーテル（エーテル）溶液\n₁₀₀ mL について、エーテルと同体積の各水溶液を用いて、分液ロートによる以下\nの操作を行った。このとき分液操作②によって得られた水層には、有機化合物Ｄの\n塩が主に含まれていた。有機化合物Ａ～Ｄを分離する分液操作の組合せとして、最\nも適切なのはどれか。1つ選べ。\nOCH3       CO2H        NH2           OH\nＡ           Ｂ           Ｃ         Ｄ\n有機化合物Ａ～Ｄを含むジエチルエーテル溶液\n分液操作①\n水層                         エーテル層\n分液操作②\n水層                               エーテル層\n分液操作③\n水層                         エーテル層\nア    ₂ mol/L 塩酸を用いる分液操作\nイ    ₂ mol/L NaOH 水溶液を用いる分液操作\nウ    飽和 NaHCO3 水溶液を用いる分液操作\n分液操作①        分液操作②            分液操作③\n1      ア               イ                    ウ\n2      イ               ウ                    ア\n3      ウ               ア                    イ\n4      ア               ウ                    イ\n5      イ               ア                    ウ\n6      ウ               イ                    ア",
    "choices": [
      {
        "key": 1,
        "text": "ア               イ                    ウ"
      },
      {
        "key": 2,
        "text": "イ               ウ                    ア"
      },
      {
        "key": 3,
        "text": "ウ               ア                    イ"
      },
      {
        "key": 4,
        "text": "ア               ウ                    イ"
      },
      {
        "key": 5,
        "text": "イ               ア                    ウ"
      }
    ],
    "correct_answer": 6,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-102",
    "year": 110,
    "question_number": 102,
    "section": "理論",
    "subject": "生物",
    "category": "",
    "question_text": "問 102 以下の反応式のうち、右に示された主生成物が誤っているのはどれか。1つ選べ。\nただし、各反応はそれぞれ適切な溶媒を用いて行い、反応終了後、適切な後処理\nを施したものとする。\nH3C                                    H3C\n1 ）NaNH2，液体アンモニア\n1             H\n2 ）CH3CH2Br\nCH3\n1）              BH\nH3C\nH3C\n2             H\nCHO\n2 ）H2O2，NaOH\nH3C                                    H3C\nHgSO4，H3O＋\nCH3\nCH3                                         O\nH2\nPd/CaCO3（リンドラー触媒）            H\nH3C                                                            CH3\nキノリン\nCH3                          H3C                H\nH3C                                    H3C\nHCl（ 2 当量）\n5                                                                       CH3\nCH3                                    Cl       Cl",
    "choices": [],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q102.png"
  },
  {
    "id": "r110-104",
    "year": 110,
    "question_number": 104,
    "section": "理論",
    "subject": "生物",
    "category": "",
    "question_text": "下図は、DNAの二重らせん構造の一部で、2本のポリヌクレオチド鎖間で形成される相補的塩基対を示している。以下の記述のうち、適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "塩基アのヘテロ環はピラジン環である。"
      },
      {
        "key": 2,
        "text": "塩基イはウリジンである。"
      },
      {
        "key": 3,
        "text": "矢印Aはポリヌクレオチド鎖ウの3′→５′末端の方向を指す。"
      },
      {
        "key": 4,
        "text": "酸素原子エは水素結合受容体として機能する。"
      },
      {
        "key": 5,
        "text": "塩基アと塩基イの相補的塩基対は、平面状に形成される。"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q104.png"
  },
  {
    "id": "r110-105",
    "year": 110,
    "question_number": 105,
    "section": "理論",
    "subject": "生物",
    "category": "",
    "question_text": "下図は、アセチルCoAが生合成される一連の反応を模式的に示している。以下の記述のうち、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "構造式アのMg2＋は、リン酸部位の陰イオンを電気的に中和し、リン原子の求電子性を高めている。"
      },
      {
        "key": 2,
        "text": "矢印イで示した酸素原子は、酢酸イオンに由来する。"
      },
      {
        "key": 3,
        "text": "アセチルCoAの点線で囲ったカルボニル基の炭素原子は、矢印ウの硫黄原子を酸素原子に置換したものに比べて求電子性が低い。"
      },
      {
        "key": 4,
        "text": "矢印エで示したリン原子は、5価4配位構造をもつキラル中心である。"
      },
      {
        "key": 5,
        "text": "アセチルCoAが生合成される過程において、CoA-SHのスルファニル基（チオール基）オは求核剤として作用し、SN2反応によりアセチル化される。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q105.png"
  },
  {
    "id": "r110-106",
    "year": 110,
    "question_number": 106,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "下図に示すブレオマイシンA2はDNA鎖を切断することができる。このために必要な化学的性質として、最も適切なのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "部分構造アにおけるFe（Ⅱ）との配位能"
      },
      {
        "key": 2,
        "text": "部分構造イにおけるMg（Ⅱ）との配位能"
      },
      {
        "key": 3,
        "text": "部分構造ウにおけるMg（Ⅱ）との配位能"
      },
      {
        "key": 4,
        "text": "部分構造エにおける光増感作用"
      },
      {
        "key": 5,
        "text": "部分構造オにおけるFe（Ⅱ）との配位能"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q106.png"
  },
  {
    "id": "r110-107",
    "year": 110,
    "question_number": 107,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "問 107        下図は、インスリンの構造を模式的に示している。図中の                                         はアミノ酸残基\nを示し、特徴のあるアミノ酸残基を ₃ 文字表記している。\nＮ末端              S                       S           Ｃ末端\nＡ鎖                 Cys Cys                Cys         Cys Asn\n₁          ₆        ₇             ₁₁          ₂₀\nS                             S     ₂₁\nＮ末端                    S                       S                      Ｃ末端\nＢ鎖           Asn        Cys                     Cys              Pro Lys Thr\n₁        ₃          ₇           ₁₀         ₁₉               ₂₈      ₃₀\nインスリン\n（   の部分はアミノ酸残基を省略している。）\n近年、インスリンの化学構造を部分的に改変することで、治療目的に沿った血糖\n降下作用を発揮するインスリンアナログ製剤（ 1 ～ 5 ）が開発されている。このう\nち、構造改変によりインスリンの等電点（pI 約 ₅ . ₄）を中性付近（pI 約 ₆ . ₇）に\n近づけることにより、生理的 pH で等電点沈殿を起こし、皮下で徐々に溶解、吸収\nされ、 ₁ 日 ₁ 回の皮下投与で安定した血糖降下作用を示すのはどれか。1つ選べ。\nなお、各アナログ製剤の構造はインスリンと同様な方法で図示しており、図中の\nはインスリンと異なるアミノ酸残基を示す。\nS                  S\nCys Cys            Cys         Cys Asn\n₁           ₆        ₇        ₁₁           ₂₀\nS                        S     ₂₁\nS                  S\nAsn         Cys                 Cys                   Lys Pro Thr\n₁        ₃           ₇       ₁₀         ₁₉                        ₂₈        ₃₀\nS                  S\nCys Cys            Cys         Cys   Gly\n₁           ₆        ₇        ₁₁           ₂₀\nS                        S     ₂₁\nS                  S\nAsn         Cys                 Cys                   Pro Lys Thr Arg Arg\n₁        ₃           ₇       ₁₀         ₁₉                        ₂₈        ₃₀\nS                  S\nCys Cys            Cys         Cys Asn\n₁           ₆        ₇        ₁₁           ₂₀\nS                        S     ₂₁\nS                  S\nLys         Cys                 Cys                   Pro Glu Thr\n₁        ₃           ₇       ₁₀         ₁₉                        ₂₈        ₃₀\nS                  S\nCys Cys            Cys         Cys Asn\n₁           ₆        ₇        ₁₁           ₂₀\nS                        S     ₂₁\n4                                             S\nS\nCO2H\nAsn         Cys                 Cys                   Pro      N\nH\n₁        ₃           ₇       ₁₀         ₁₉                        ₂₈\nHN\nO\nH\nHO2C                                            N\nO       CO2H\nS                  S\nCys Cys            Cys         Cys Asn\n₁           ₆        ₇        ₁₁           ₂₀\nS                        S     ₂₁\nS                  S\nAsn         Cys                 Cys                   Asp Lys Thr\n₁        ₃           ₇       ₁₀         ₁₉                        ₂₈        ₃₀",
    "choices": [],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q107.png"
  },
  {
    "id": "r110-108",
    "year": 110,
    "question_number": 108,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "図は、アラニン誘導体Aの1H NMRスペクトル［400MHz、CDCl3、基準物質はテトラメチルシラン（TMS）］を示している。以下の記述のうち、正しいのはどれか。２つ選べ。\n\n　なお、×印のシグナルはCDCl3中に含まれるCHCl3のプロトンに由来するシグナルであり、fのピークは重水（D2O）を添加するとほぼ消失した。",
    "choices": [
      {
        "key": 1,
        "text": "ピークa、b、cのプロトン数の合計は6である。"
      },
      {
        "key": 2,
        "text": "ピークeに対応するプロトンはエであり、重水を加えると四重線（カルテット）となる。"
      },
      {
        "key": 3,
        "text": "ピークgに対応するプロトンはカとキである。"
      },
      {
        "key": 4,
        "text": "アのプロトンとカップリング（スピン-スピン結合）しているのは、ピークdに対応するプロトンである。"
      },
      {
        "key": 5,
        "text": "イのプロトンのピークは、コのプロトンのシグナルより高磁場側にある。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q108.png"
  },
  {
    "id": "r110-109",
    "year": 110,
    "question_number": 109,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "下図はアコニチンの構造を示している。これを主要成分として含有する生薬Aに関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アコニチンの骨格は、酢酸–マロン酸経路により生合成される。"
      },
      {
        "key": 2,
        "text": "アコニチンの窒素原子は、アミノ酸由来ではない。"
      },
      {
        "key": 3,
        "text": "高圧蒸気処理などの修治によってアコニチンのエステルが加水分解されて、毒性が低減する。"
      },
      {
        "key": 4,
        "text": "生薬Aはナス科植物の根を基原とする。"
      },
      {
        "key": 5,
        "text": "生薬Aを含む処方は、体力が充実している患者に適応される。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nアコニチンは、ジテルペンアルカロイドであり、その骨格はイソプレノイド経路により生合成される。\n\n２　正\n\nアコニチンの窒素は、アミノ酸由来ではなく、アンモニアから導入される。\n\n３　正\n\nブシはそのままだと毒性が非常に強いため、修治（しゅうじ）という加工処理を行う。\n\n具体的には、高圧蒸気処理によりアコニチンのエステル結合が加水分解され、アコニンへと変化し、毒性が大きく減弱する。\n\n４　誤\n\n生薬A（ブシ）はナス科ではなく、キンポウゲ科植物（ハナトリカブト又はオクトリカブト）の塊根を加工して得られる。\n\n５　誤\n\nブシは、体力が低下した患者に適応され、冷えや慢性的な疼痛などの改善に用いられる。なお、体力が充実している患者への使用は、基本的には推奨されない。",
    "tags": [],
    "image_url": "/images/questions/110/q109.png"
  },
  {
    "id": "r110-110",
    "year": 110,
    "question_number": 110,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "問 110        以下の漢方処方が示す作用と、それに主に関与する構成生薬との組合せのう\nち、誤っているのはどれか。1つ選べ。\n処方名と作用                    主に関与する構成生薬\n1     六君子湯の補気作用                          ニンジン\n2     桂枝茯苓丸の駆瘀血作用                        トウニン\n3     加味逍遙散の補血作用                         トウキ\n4     葛根湯の発汗作用                           シャクヤク\n5     五苓散の利水作用                           ブクリョウ",
    "choices": [
      {
        "key": 1,
        "text": "六君子湯の補気作用                          ニンジン"
      },
      {
        "key": 2,
        "text": "桂枝茯苓丸の駆瘀血作用                        トウニン"
      },
      {
        "key": 3,
        "text": "加味逍遙散の補血作用                         トウキ"
      },
      {
        "key": 4,
        "text": "葛根湯の発汗作用                           シャクヤク"
      },
      {
        "key": 5,
        "text": "五苓散の利水作用                           ブクリョウ"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-111",
    "year": 110,
    "question_number": 111,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "心筋の興奮と収縮に関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "洞房結節に生じた電気的興奮は、心房内を伝わり房室結節を経て心室筋へと伝わる。"
      },
      {
        "key": 2,
        "text": "電位依存性K＋チャネルの活性化により、心室筋に脱分極が生じる。"
      },
      {
        "key": 3,
        "text": "心室筋の脱分極に伴って増加した細胞内のCa2＋がトロポニンに結合することによって、心室筋が収縮する。"
      },
      {
        "key": 4,
        "text": "心室筋の脱分極によって、P波が心電図に記録される。"
      },
      {
        "key": 5,
        "text": "心拍数を増加させ心臓血管中枢からのシグナルは、迷走神経を介して伝わる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n電位依存性K＋チャネルの活性化により、心室筋細胞内から心室筋細胞外へK＋が移行し、心室筋細胞の電位が低下するため、再分極（活動電位が元の状態に戻る過程）する。\n\n３　正\n\n心室筋の収縮は、以下の順で起こる。\n\n　Ca2＋チャネルが開口→細胞外からCa2＋が流入し、筋小胞体からさらにCa2＋が放出される→Ca2＋がトロポニンCに結合し、アクチンとミオシンの相互作用が促進される（心室筋が収縮する）。\n\n４　誤\n\n心室筋の脱分極によって、QRS波が心電図に記録される。なお、心房の脱分極によって、P波が心電図に記録される。\n\n５　誤\n\n心臓血管中枢は、自律神経の機能を介して心拍数を調節する。心拍数を調節する自律神経系には、交感神経及び副交感神経（迷走神経）があり、交感神経が心拍数を増加させ、副交感神経（迷走神経）が心拍数を減少させる。",
    "tags": []
  },
  {
    "id": "r110-112",
    "year": 110,
    "question_number": 112,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "問 112        甲状腺ホルモン（T3、T4）はヨウ素を含むアミノ酸誘導体であるが、アミノ酸\nから直接作られるのではない。甲状腺濾胞における生合成過程では、タンパク質の\nチログロブリンが前駆物質となる。下図は、甲状腺濾胞において T3、T4 が作られ\nるまでに、チログロブリンが移動する流れを示したものである。チログロブリンは\n甲状腺濾胞上皮細胞で作られてからコロイド中に分泌され、再び甲状腺濾胞上皮細\n胞に取り込まれ、最終的に T3、T4 が濾胞外に分泌される。図中の 1 ～ 5 のうち、\nチログロブリンのヨウ素化反応が行われる場所はどれか。1つ選べ。\n小胞体\nゴルジ体\n分泌小胞    3\nコロイド                コロイド\nエンド\n分泌 リソソーム ソーム                                甲状腺濾胞\n小胞\n甲状腺濾胞上皮細胞",
    "choices": [],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q112.png"
  },
  {
    "id": "r110-113",
    "year": 110,
    "question_number": 113,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "幹細胞に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "造血幹細胞は、単能性幹細胞である。"
      },
      {
        "key": 2,
        "text": "組織幹細胞は、非対称な細胞分裂をしない。"
      },
      {
        "key": 3,
        "text": "人工多能性幹細胞（iPS細胞）は、成体の体細胞に複数の遺伝子を導入し、分化状態を初期化することにより作製される。"
      },
      {
        "key": 4,
        "text": "胚性幹細胞（ES細胞）は、初期胚の内部細胞塊から樹立される。"
      },
      {
        "key": 5,
        "text": "ES細胞は、全能性を持つ。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n組織幹細胞は、非対称分裂を行う。非対称分裂とは、一方の娘細胞が幹細胞として残り、もう一方が分化する細胞となる分裂のことである。\n\n３　正\n\n人工多能性幹細胞（iPS細胞）は、成体の体細胞に4種類の遺伝子を導入し、分化状態を初期化することにより作製される。\n\n４　正\n\n胚性幹細胞（ES細胞）は、外胚葉、中胚葉、内胚葉のどの胚葉系にも分化できる多分化能を有している細胞株で、初期胚の内部細胞塊から樹立される。\n\n５　誤\n\nES細胞は、あらゆる体細胞に分化できるため、多能性を有しているが、胎盤になることができないため、全能性を有していない。なお、全能性とは、個体全体を形成する能力を有することである。",
    "tags": []
  },
  {
    "id": "r110-114",
    "year": 110,
    "question_number": 114,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "ヒトにおける脂肪酸の生合成に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ミトコンドリアで行われる。"
      },
      {
        "key": 2,
        "text": "アシル鎖の伸長過程で、補酵素としてNADHが利用される。"
      },
      {
        "key": 3,
        "text": "クエン酸により促進される。"
      },
      {
        "key": 4,
        "text": "アセチルCoAを前駆物質としてリノール酸が合成される。"
      },
      {
        "key": 5,
        "text": "アセチルCoAをマロニルCoAに転換する反応が律速段階である。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\nアシル鎖の伸長過程で、補酵素としてNADPHが利用される。NADPHはペントースリン酸回路から供給される。\n\n３　正\n\n脂肪酸合成の律速段階であるアセチルCoAカルボキシラーゼは、クエン酸によりアロステリックに活性化される。また、クエン酸はミトコンドリアで生成されたアセチルCoAを細胞質に運ぶ役割もあり、脂肪酸合成の中心的な調節因子である。\n\n４　誤\n\nヒトは、リノール酸を体内で生合成できないため、食事から摂取する必要がある（リノール酸は必須脂肪酸である）。\n\n５　正\n\n脂肪酸の生合成の過程における律速段階は、アセチルCoAがマロニルCoAへ変換される反応である。なお、脂肪酸の律速段階に関わる酵素はアセチルCoAカルボキシラーゼである。",
    "tags": []
  },
  {
    "id": "r110-115",
    "year": 110,
    "question_number": 115,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "コラーゲンは、下図に示すように、ポリペプチド鎖（コラーゲン単量体）の3本が、らせん状に絡み合って三重らせん構造（コラーゲン三量体）を形成する。図上段に示すように、単量体ポリペプチド鎖のアミノ酸配列では、3個おきにグリシン残基（Gly）が配置する。Xはプロリン（Pro）の翻訳後修飾で生じたアミノ酸である。このコラーゲンに関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "コラーゲンの三重らせん構造は、α-ヘリックスである。"
      },
      {
        "key": 2,
        "text": "Xは、ヒドロキシ化されたプロリンである。"
      },
      {
        "key": 3,
        "text": "グリシン残基が繰り返し存在することが、三重らせん構造の形成に重要である。"
      },
      {
        "key": 4,
        "text": "ビタミンCは、コラーゲン産生細胞の核内に入り、コラーゲン遺伝子の転写を促進する。"
      },
      {
        "key": 5,
        "text": "コラーゲン三量体は、細胞内の細胞骨格を構成することにより組織の強度を保つ。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\nXは、ヒドロキシプロリンである。ヒドロキシプロリンは、プロリンのヒドロキシル化（OH基の付加）によって生成される翻訳後修飾されたアミノ酸であり、コラーゲンの安定性に重要な役割を果たす。なお、プロリンのヒドロキシル化反応は、ビタミンC（アスコルビン酸）が関与している。\n\n３　正\n\nコラーゲンは、「グリシン-X-Y」の繰り返し配列を有しており、3残基ごとにグリシンが配置されている。グリシンは、最も小さいアミノ酸であり、三重らせん構造の中央に位置し、構造形成に重要な役割を果たしている。グリシンが他のアミノ酸に置き換えられると、3重らせん構造が安定せず、コラーゲンの機能が損なわれる。\n\n４　誤\n\nビタミンC（アスコルビン酸）は、プロリンヒドロキシラーゼの補酵素として作用し、プロリンのヒドロキシ化を促進する。ビタミンC（アスコルビン酸）が不足すると、ヒドロキシプロリンの生合成が十分に行われず、コラーゲンの安定性が低下し、壊血病の原因となる。\n\n５　誤\n\nコラーゲンは、細胞外マトリックスの主要成分であり、細胞外で組織の強度を維持する。",
    "tags": [],
    "image_url": "/images/questions/110/q115.png"
  },
  {
    "id": "r110-116",
    "year": 110,
    "question_number": 116,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "図1に示すDNAの塩基配列は、ある遺伝子のセンス鎖の一部で、転写・翻訳されるときの読み枠は配列の下に示されている。この塩基配列中＊印のシトシン残基2ヶ所に脱アミノ反応が生じた。変化したヌクレオチド残基が修復されずに塩基配列の変異が2ヶ所とも固定した。ただし、フレームシフト変異は起きていない。変異したDNAが転写・翻訳されてできるタンパク質の該当部分のアミノ酸配列はどれか。１つ選べ。図2にコドン対応表を示す。",
    "choices": [
      {
        "key": 1,
        "text": "Thr-Glu-Arg"
      },
      {
        "key": 2,
        "text": "Ile-Glu-Cys"
      },
      {
        "key": 3,
        "text": "Thr-Glu-Cys"
      },
      {
        "key": 4,
        "text": "Leu-Glu-Trp"
      },
      {
        "key": 5,
        "text": "Ile-Glu-Arg"
      }
    ],
    "correct_answer": 2,
    "explanation": "5′…①AUT ②GAA ③UGT…3′\n\n①：AUTに対応するmRNAは、AUUとなり図2より対応するアミノ酸はIleとなる。②：GAAに対応するmRNAは、GAAとなり図2より対応するアミノ酸はGluとなる。③：UGTに対応するmRNAは、UGUとなり図2より対応するアミノ酸はCysとなる。\n\nよって、変異したDNAが転写・翻訳されてできるタンパク質の該当部分のアミノ酸配列はIle-Glu-Cysとなる。",
    "tags": [],
    "image_url": "/images/questions/110/q116.png"
  },
  {
    "id": "r110-117",
    "year": 110,
    "question_number": 117,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "細胞周期は有糸分裂と細胞質分裂が起こる分裂期（M期）と間期に分けられ、間期はさらにG1期、S期、G2期に分けられる。増殖中の細胞集団の細胞に対して、DNA結合性蛍光色素で細胞を標識した。このとき蛍光強度は細胞内DNA量を反映する。個々の細胞の蛍光強度を測定したところ、相対蛍光強度と細胞数の関係は下図のようになった。G2期の細胞はどこに分布するか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "領域A"
      },
      {
        "key": 2,
        "text": "領域B"
      },
      {
        "key": 3,
        "text": "領域C"
      },
      {
        "key": 4,
        "text": "領域Aと領域B"
      },
      {
        "key": 5,
        "text": "領域Aと領域C"
      }
    ],
    "correct_answer": 3,
    "explanation": "設問の図\n\n領域A：蛍光強度が弱く、染色体の量が2nであることを示す→G1期\n\n領域B：蛍光強度が中程度で、染色体の量が2n〜4nの範囲にある→S期\n\n領域C：蛍光強度が強く、染色体の量が4nであることを示す→G2期\n\n上記のことからG2期の細胞は「領域C」である。",
    "tags": [],
    "image_url": "/images/questions/110/q117.png"
  },
  {
    "id": "r110-118",
    "year": 110,
    "question_number": 118,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "マクロファージをリポ多糖で刺激して得た培養液を採取し、この培養液中のサイトカインXの濃度をサンドイッチELISA（Enzyme-linked immunosorbent assay）法で定量することにした。\n\n各試料をマイクロプレートに採取し反応を行った後、450 nmの吸光度を測定した。 サイトカインXの標準物質を用いて標準曲線（検量線）を作成したところ、下図のようになった。この測定に関する記述として適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "この培養液の測定値が吸光度1.5であった場合、培養液を希釈して再測定することが必要である。"
      },
      {
        "key": 2,
        "text": "10倍希釈した培養液の測定値が吸光度0.6である場合、もとの培養液中のサイトカインX濃度は約600pg/mLである。"
      },
      {
        "key": 3,
        "text": "培養液に含まれる別のサイトカインYを測定するためには、サイトカインXの測定とすべて同じ抗体を利用できる。"
      },
      {
        "key": 4,
        "text": "サンドイッチELISA法では抗原に対する2種類の抗体が使われるが、それぞれの抗体が認識するエピトープは異なる。"
      },
      {
        "key": 5,
        "text": "この培養液の測定で発色が検出限界以下だった場合、標準曲線（検量線）の測定の場合よりも反応時間を長めにしてもよい。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n標準曲線（検量線）より、10倍希釈した培養液の測定値が吸光度0.6のとき、サイトカインXの濃度は約600pg/mLである。10倍希釈した培養液のサイトカインXの濃度が約600pg/mLであることから、もとの培養液中のサイトカインX濃度は約6,000pg/mL（6ng/mL）である。\n\n３　誤\n\nELISA法では、抗体が特定の抗原に特異的に結合するため、サイトカインXと異なるサイトカインYを測定するには、Yに特異的な抗体を用いる必要がある。\n\n４　正\n\nサンドイッチELISAでは、捕捉抗体と検出抗体の2種類の抗体を用いる。両方の抗体が同じエピトープを認識すると、競合現象が起こり測定結果に影響が現れるため、それぞれ異なるエピトープを認識する抗体を用いる必要がある。\n\n５　誤\n\n反応時間を長くすると、正確な定量が困難なため、検出限界以下の場合、試料を濃縮するなど別の方法を検討する必要がある。",
    "tags": [],
    "image_url": "/images/questions/110/q118.png"
  },
  {
    "id": "r110-119",
    "year": 110,
    "question_number": 119,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "細菌毒素に関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "リポ多糖は、グラム陰性菌外膜の構成成分であり、多糖部位に免疫刺激作用がある。"
      },
      {
        "key": 2,
        "text": "スーパー抗原は、B細胞受容体と非特異的に結合して抗体産生を抑制する。"
      },
      {
        "key": 3,
        "text": "ストレプトリジンOは、化膿レンサ球菌から産生され、コレステロールと結合して宿主の細胞膜に孔をあける。"
      },
      {
        "key": 4,
        "text": "ベロ毒素は、百日咳菌から産生され、咽頭粘膜と結合して偽膜を形成する。"
      },
      {
        "key": 5,
        "text": "破傷風毒素は、運動神経の終末部から取り込まれ、脊髄まで運ばれる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nリポ多糖は、グラム陰性菌外膜の構成成分であり、リピドA、コア多糖、O抗原の3つの部分で構成される。リピドAは、エンドトキシン活性体の本体であり、強い免疫刺激作用を示す。また、コア多糖は、リポ多糖の構造を維持する役割を有しており、弱い免疫刺激作用を示す。\n\n２　誤\n\nスーパー抗原は、T細胞受容体（TCR）に非特異的に結合し、大量のT細胞を活性化させ、異常な免疫応答を引き起こす。\n\n３　正\n\nストレプトリジンOは、化膿レンサ球菌（A郡β溶血性レンサ球菌）が産生する溶血毒素であり、細胞膜のコレステロールと結合し、孔を開けることで細胞を破壊する。\n\n４　誤\n\nベロ毒素は、腸管出血性大腸菌（O157など）が産生し、腸管上皮を傷害する。なお、百日咳菌は、百日咳毒素（ADPリボシル化毒素）を産生し、Giタンパク質をADPリボシル化させ、間接的にアデニル酸シクラーゼを活性化することで、cAMPを増加させる。\n\n５　正\n\n破傷風毒素は、運動神経終末から取り込まれ、逆行性輸送で脊髄に到達し、抑制性神経伝達を抑制することで、筋肉の過剰な収縮（痙攣性麻痺）を引き起こす。",
    "tags": []
  },
  {
    "id": "r110-120",
    "year": 110,
    "question_number": 120,
    "section": "理論",
    "subject": "実務",
    "category": "",
    "question_text": "ナイアシンに関する以下の問いに答えよ。\n問120（衛生）\n\nナイアシンに関する記述として正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "妊娠中にナイアシンが欠乏すると、胎児に神経管閉鎖障害が起こる。"
      },
      {
        "key": 2,
        "text": "ナイアシンが欠乏すると、皮膚炎や下痢、中枢神経症状が現れる。"
      },
      {
        "key": 3,
        "text": "ナイアシンの一種であるニコチン酸には「日本人の食事摂取基準（2020年版）」で耐容量上限が設定されていない。"
      },
      {
        "key": 4,
        "text": "トウモロコシを主食とする地域では、ナイアシンの欠乏症に注意する必要がある。"
      },
      {
        "key": 5,
        "text": "ナイアシンが過剰になると、頭蓋内圧の亢進が起こる。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\nナイアシンが欠乏すると、ペラグラ（症状：皮膚炎、下痢、中枢神経障害（認知障害））が現れる。\n\n３　誤\n\nナイアシンの一種であるニコチン酸には耐容量上限が設定されている。\n\n４　正\n\nトウモロコシを主食とする地域では、ナイアシン欠乏症が発生しやすい。トウモロコシには、ナイアシンが含まれているが、結合型で存在するため、そのままでは消化管から吸収されにくい。トウモロコシからナイアシンを摂取するためには、アルカリ処理を行うことが有効とされている。\n\n５　誤\n\nナイアシンが過剰になると、消化不良、重篤な下痢、便秘、肝機能低下が生じることがあるが、頭蓋内圧の亢進は現れにくい。なお、ビタミンAの過剰摂取により、頭蓋内圧の亢進が現れることがある。",
    "tags": []
  },
  {
    "id": "r110-121",
    "year": 110,
    "question_number": 121,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "問 120−121      ナイアシンに関する以下の問いに答えよ。\n問 121（物理・化学・生物）\nナイアシンから合成される下図の補酵素について、正しいのはどれか。2つ選\nべ。\nH       H O\nO-                            NH2\nO P O                N\nO\nO\nOH OH              NH2\nN\nN\nO P O                N     N\nO-          O\nOH O\nO P O-\nO-\n1     酸化型の構造を示している。\n2     ₃₄₀ nm の吸収極大を有する。\n3     ₃︲ヒドロキシ︲₃︲メチルグルタリル CoA（HMG︲CoA）からメバロン酸を産生\nする反応に関与する。\n4     ピルビン酸からアセチル CoA を産生する反応に関与する。\n5     ミトコンドリア内膜上での電子の受け渡しに関与する。\n一般問題（薬学理論問題）【衛生】",
    "choices": [
      {
        "key": 1,
        "text": "酸化型の構造を示している。"
      },
      {
        "key": 2,
        "text": "₃₄₀ nm の吸収極大を有する。"
      },
      {
        "key": 3,
        "text": "₃︲ヒドロキシ︲₃︲メチルグルタリル CoA（HMG︲CoA）からメバロン酸を産生 する反応に関与する。"
      },
      {
        "key": 4,
        "text": "ピルビン酸からアセチル CoA を産生する反応に関与する。"
      },
      {
        "key": 5,
        "text": "ミトコンドリア内膜上での電子の受け渡しに関与する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q121.png"
  },
  {
    "id": "r110-122",
    "year": 110,
    "question_number": 122,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "下表は、日本人を対象とした5つのコホート研究のデータを統合して解析し、男性の飲酒量と大腸がん、結腸がん及び直腸がんの関係について調べた結果である。この表に関する記述として正しいのはどれか。２つ選べ。\n\n　ただし、下表を基に算出した「飲酒しない群」の大腸がん発症率は10万観察人年当たり142人、「23.0g/日以上のアルコール摂取群」の大腸がん発症率は10万観察人年当たり196人である。",
    "choices": [
      {
        "key": 1,
        "text": "週に1回未満の飲酒であっても、飲酒は大腸がんのリスクを有意に増加させる。"
      },
      {
        "key": 2,
        "text": "22.9g/日以下のアルコール摂取であっても、週に1回以上の飲酒は直腸がんのリスクを有意に増加させる。"
      },
      {
        "key": 3,
        "text": "23.0g/日以上のアルコール摂取は、結腸がんのリスクを有意に増加させる。"
      },
      {
        "key": 4,
        "text": "飲酒しない群と比較して、23.0g/日以上のアルコールを摂取する日本人男性では、飲酒によって10万観察人年当たり338人が過剰に大腸がんを発症すると推定される。"
      },
      {
        "key": 5,
        "text": "飲酒しない群と比較して、23.0g/日以上アルコールを摂取する日本人男性の大腸がんのうち、28%は飲酒によるものであると推定される。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n「0.1–22.9g/日」のアルコール摂取群における直腸がんのハザード比95％信頼区間（0.90〜1.56）も1を含んでおり、統計的に有意なリスク上昇とはいえない。\n\n３　正\n\n「23.0g/日以上」の群では、結腸がんのハザード比95％信頼区間（1.31〜1.95）が1を超えており、統計的に有意なリスク上昇があるといえる。\n\n４　誤\n\n問題文より、「飲酒しない群」の大腸がん発症率は142人／10万観察人年、「23.0g/日以上」の群は196人／10万観察人年であるため、飲酒によって過剰に発症する人数は196－142 = 54人であり、「338人」は誤りである。\n\n５　正\n\n「23.0g/日以上のアルコールを摂取する群」の大腸がん発症率は、10万観察人年あたり196人である。一方、飲酒しない群との比較により、飲酒によって過剰に発症している大腸がんの数は10万観察人年あたり54人と算出される。したがって、この飲酒群における大腸がんのうち約28%（54÷196）は飲酒が原因であると推定される。",
    "tags": [],
    "image_url": "/images/questions/110/q122.png"
  },
  {
    "id": "r110-123",
    "year": 110,
    "question_number": 123,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "問 123        疾病予防とその目的及び具体例の組合せのうち、正しいのはどれか。2つ選\nべ。\n疾病予防      目   的               具体例\n1    一次予防   早期発見・早期治療       新生児マススクリーニング\n2    一次予防   健康増進            衛生教育や健康教室\n3    二次予防   特異的予防           予防接種\n4    二次予防   早期発見・早期治療       デイサービス\n5    三次予防   能力低下防止          呼吸用保護具の使用\n6    三次予防   機能回復            リハビリテーション",
    "choices": [
      {
        "key": 1,
        "text": "一次予防   早期発見・早期治療       新生児マススクリーニング"
      },
      {
        "key": 2,
        "text": "一次予防   健康増進            衛生教育や健康教室"
      },
      {
        "key": 3,
        "text": "二次予防   特異的予防           予防接種"
      },
      {
        "key": 4,
        "text": "二次予防   早期発見・早期治療       デイサービス"
      },
      {
        "key": 5,
        "text": "三次予防   能力低下防止          呼吸用保護具の使用"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-124",
    "year": 110,
    "question_number": 124,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "下図は性感染症報告数（男女総数）の年次推移を示しており、ア〜ウは梅毒、性器クラミジア感染症又は淋菌感染症のいずれかである。以下の記述のうち正しいのはどれか。２つ選べ。\n（注）感染症法：感染症の予防及び感染症の患者に対する医療に関する法律",
    "choices": [
      {
        "key": 1,
        "text": "アは、淋菌感染症である。"
      },
      {
        "key": 2,
        "text": "イの病原体は、ウイルスである。"
      },
      {
        "key": 3,
        "text": "イの母子感染の経路は、主に母乳感染である。"
      },
      {
        "key": 4,
        "text": "ウの血液感染防止のため、献血された血液の抗体検査が行われている。"
      },
      {
        "key": 5,
        "text": "ウは、感染症法（注）により、全医療機関において全数把握となっている。"
      }
    ],
    "correct_answer": 4,
    "explanation": "２　誤\n\nイ（淋菌感染症）の病原体は、淋菌（細菌）であり、ウイルスではない。\n\n３　誤\n\nイ（淋菌感染症）の母子感染の主な経路は、分娩時の産道感染である。\n\n４　正\n\nウ（梅毒）は、血液感染を起こすため、献血時には梅毒抗体検査が実施される。\n\n５　正\n\nウ（梅毒）は、感染症法における五類感染症の全数把握対象疾患に該当する。すべての医療機関は、梅毒と診断した場合、保健所に届け出る義務がある。",
    "tags": [],
    "image_url": "/images/questions/110/q124.png"
  },
  {
    "id": "r110-125",
    "year": 110,
    "question_number": 125,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "この20年間の生活習慣病に関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "糖尿病の患者数は40歳代より急激に増加するが、そのほとんどは1型糖尿病である。"
      },
      {
        "key": 2,
        "text": "慢性閉塞性肺疾患（COPD）による総死亡者数は減少傾向にある。"
      },
      {
        "key": 3,
        "text": "心疾患による粗死亡率は増加傾向にある。"
      },
      {
        "key": 4,
        "text": "脳血管疾患のうち、粗死亡率が最も高いのは、脳内出血である。"
      },
      {
        "key": 5,
        "text": "全悪性新生物死亡のうち、膵臓がんの死亡者数は男女とも増加傾向にある。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n慢性閉塞性肺疾患（COPD）による総死亡者数は増加傾向にある。COPDの主なリスク要因は長年の喫煙であり、若い頃から継続して喫煙してきた患者が総死亡数の増加に寄与している。\n\n３　正\n\n心疾患による粗死亡率は、高齢化の影響を受けて増加傾向にある。\n\n４　誤\n\n脳血管疾患のうち、粗死亡率が最も高いのは脳梗塞である。なお、脳内出血による死亡率が減少傾向にある。\n\n５　正\n\n膵臓がんの死亡者数は男女ともに増加傾向にある。",
    "tags": []
  },
  {
    "id": "r110-126",
    "year": 110,
    "question_number": 126,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "新生児マススクリーニングの対象疾患のうち、タンデムマス法によるアシルカルニチンの測定結果により診断されるのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ガラクトース血症"
      },
      {
        "key": 2,
        "text": "先天性甲状腺機能低下症"
      },
      {
        "key": 3,
        "text": "中鎖アシルCoA脱水素酵素欠乏症（MCAD欠損症）"
      },
      {
        "key": 4,
        "text": "フェニルケトン尿症"
      },
      {
        "key": 5,
        "text": "プロピオン酸血症"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nガラクトース血症は糖代謝異常にあたるため、タンデムマス法では検出できない。\n\n２　誤\n\n先天性甲状腺機能低下症（クレチン症）は、内分泌系の疾患であるため、タンデムマス法では検出できない。\n\n３　正\n\n中鎖アシルCoA脱水素酵素欠損症（MCAD欠損症）は脂肪酸代謝異常にあたり、タンデムマス法でアシルカルニチンを指標として検出される。\n\n４　誤\n\nフェニルケトン尿症は、アミノ酸の代謝異常であり、タンデムマス法で分析可能だが、測定されるのはアミノ酸である。\n\n５　正\n\nプロピオン酸血症は、有機酸代謝異常症に分類され、タンデムマス法でアシルカルニチンを指標として検出される。",
    "tags": []
  },
  {
    "id": "r110-127",
    "year": 110,
    "question_number": 127,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "食品A～Cにおけるタンパク質の栄養価を比較するために、「日本食品標準成分表2020年版（八訂）アミノ酸成分表」を用いて、アミノ酸組成（mg/gタンパク質）を調べ、「FAO/WHO/UNU（2007年）のアミノ酸評点パターン（1～2歳）」と比較した。下図に関する記述として正しいのはどれか。2つ選べ。ただし、食品A～Cは、米、はとむぎ又は鶏卵のいずれかである。",
    "choices": [
      {
        "key": 1,
        "text": "食品Aは鶏卵である。"
      },
      {
        "key": 2,
        "text": "食品Bには制限アミノ酸がない。"
      },
      {
        "key": 3,
        "text": "食品Cの第一制限アミノ酸は、トリプロファンである。"
      },
      {
        "key": 4,
        "text": "アミノ酸スコアは、食品A＞食品B＞食品Cである。"
      },
      {
        "key": 5,
        "text": "食品Cのアミノ酸スコアは77である。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n食品Aは鶏卵と推測できる。動物性食品は一般的に必須アミノ酸を十分に含むため、制限アミノ酸がなく、アミノ酸スコアは100になる。図から、食品Aには制限アミノ酸が見られないため、動物性食品である鶏卵と判断できる。なお、食品BとCは米とはとむぎだが、この図だけではどちらがどちらかを判断することはできない。\n\n２　誤\n\nアミノ酸評点パターンと食品Bのアミノ酸組成を比較すると、リシン（リジン）の量は評点パターンの52に対して40であり、基準値を下回っている。したがって、食品Bの制限アミノ酸はリシン（リジン）である。\n\n３　誤\n\n食品Cにおいて、アミノ酸評価基準と比べてリシン（リジン）とトリプトファンが不足している。特にリシン（リジン）は、不足が最も大きい第一制限アミノ酸である。\n\n４　正\n\nアミノ酸スコアは、次の式で計算できる。\n\n食品A\n\n　制限アミノ酸がないため、アミノ酸スコアは100となる。\n\n食品B\n\n　第一制限アミノ酸はリシン（リジン）であり、アミノ酸スコアは約77である。\n\n食品C\n\n　第一制限アミノ酸はリシン（リジン）であり、アミノ酸スコアは約35である。\n\n上記より、ア",
    "tags": [],
    "image_url": "/images/questions/110/q127.png"
  },
  {
    "id": "r110-128",
    "year": 110,
    "question_number": 128,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "食品添加物A〜Eに関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "Aは、食品に甘味を与える目的で使用される指定添加物である。"
      },
      {
        "key": 2,
        "text": "Bは、鮮魚介類や食肉、野菜類の色調を調節する目的で使用される。"
      },
      {
        "key": 3,
        "text": "Cは、食品を漂白する目的で使用され、殺菌料としても用いられる。"
      },
      {
        "key": 4,
        "text": "Dは、金属イオンと錯体を形成することによって、油脂などの酸化を防ぐ目的で使用される。"
      },
      {
        "key": 5,
        "text": "Eは、カビや細菌などの発育を抑制し、保存性を高める目的で乳製品などの食品に添加して使用される。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nBは食用赤色2号（アマランス）であり、芳香族構造にスルホン酸基が複数結合した構造をしている。Bは以前魚介類や野菜などの色調を整えるために使用されていたが、鮮度をごまかすなど消費者に誤解を与える可能性があるので、現在では使用が禁止されている。\n\n３　正\n\nCは次亜塩素酸ナトリウムであり、食品を漂白するだけでなく、殺菌剤としても幅広く使用されている。\n\n４　誤\n\nDはエリソルビン酸であり、アスコルビン酸（ビタミンC）と類似構造をしている。Dはラジカル捕捉型の酸化防止剤として使用され、油脂の酸化を防止する目的で使用される。\n\n５　誤\n\nEはチアベンダゾールであり、構造中にチアゾール環を有している。Eは主に柑橘類などを輸入する際に、輸送中のカビ発生を防止する目的で使用される。",
    "tags": [],
    "image_url": "/images/questions/110/q128.png"
  },
  {
    "id": "r110-129",
    "year": 110,
    "question_number": 129,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "特別用途食品と保健機能食品に関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "機能性表示食品には、疾病リスク低減表示が認められている。"
      },
      {
        "key": 2,
        "text": "特定保健用食品は、消費者庁による安全性と機能性に関する審査を行うことなく事業者が販売できる。"
      },
      {
        "key": 3,
        "text": "n-3系脂肪酸は、栄養機能食品として機能を表示することができる。"
      },
      {
        "key": 4,
        "text": "保健機能食品以外の食品には、機能性の表示が認められていない。"
      },
      {
        "key": 5,
        "text": "病者用食品を販売するためには、厚生労働省に届け出なければならない。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n特定保健用食品は、消費者庁長官の個別審査で安全性・有効性の確認を受け、許可を取得しなければ販売できない。なお、機能表示性食品は消費者庁の審査を必要とせず、安全性及び機能性の根拠に関する情報を販売前に消費者庁に届出すれば、販売することが可能である。\n\n３　正\n\nn-3系脂肪酸は、栄養機能食品として機能性表示が認められている。栄養機能食品は、ビタミン・ミネラルに加えて、n-3系脂肪酸（DHAなど）を対象成分として、不足しがちな栄養素の補給・補完を目的に利用され、栄養成分の機能表示が認められている。\n\n４　正\n\n保健機能食品以外の食品には、機能性表示は認められていない。機能性表示が認められているのは、特定保健用食品・栄養機能食品・機能性表示食品の3区分であり、これ以外の一般食品では機能性を表示することはできない。\n\n５　誤\n\n病者用食品を販売するためには、許可基準への適合性を証明し、消費者庁長官の許可を受けなければならない。",
    "tags": []
  },
  {
    "id": "r110-130",
    "year": 110,
    "question_number": 130,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "食の安全を確保するための法制度に関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "食品衛生法に基づいて広域連携協議会が設置され、複数の都道府県にまたがる広域的な食中毒事案への対策が講じられている。"
      },
      {
        "key": 2,
        "text": "HACCPに沿った衛生管理では、都道府県が作成した衛生管理計画に基づいて衛生管理を実施しなければならない。"
      },
      {
        "key": 3,
        "text": "食品衛生法では、薬剤師は、指定成分等含有食品の摂取によるものと疑われる人の健康被害の把握に努めることとされている。"
      },
      {
        "key": 4,
        "text": "食品表示法に基づく栄養成分表示では、熱量、たんぱく質、脂質、炭水化物、カルシウム及びビタミン類の表示が義務づけられている。"
      },
      {
        "key": 5,
        "text": "分別生産流通管理（IPハンドリング）が行われた非遺伝子組換え農産物を原料とする食品は、「遺伝子組換えでない」の表示が義務づけられている。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nHACCPに沿った衛生管理では、営業者が作成した衛生管理計画に基づいて衛生管理を実施する必要がある。都道府県が作成した計画に基づくわけではない。\n\n３　正\n\n食品衛生法の改正により、プエラリア・ミリフィカ、ブラックコホシュ、コレウス・フォルスコリー、ドオウレンの4種類の成分が「特別の注意を必要とする成分等」として指定された。これらの成分を含む食品を摂取することで健康被害が発生する可能性がある。このことから、これらの成分を含む食品で健康被害が発生した場合には、その事実を把握した者（薬剤師を含む販売者等）は、速やかに都道府県知事に届け出ることが義務づけられている。\n\n４　誤\n\n食品表示法に基づく栄養成分表示では、熱量、たんぱく質、脂質、炭水化物、ナトリウム（食塩相当量で表示）の表示は義務づけられているが、カルシウムおよびビタミン類は義務表示ではなく任意表示である。\n\n５　誤\n\n分別生産流通管理（IPハンドリング）が行われた非遺伝子組換え農産物を原料とする食品については、『遺伝子組換えでない』の表示は義務ではなく任意である。",
    "tags": []
  },
  {
    "id": "r110-131",
    "year": 110,
    "question_number": 131,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "化学物質の毒性又は毒性発現機序に関する記述として正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "吸入暴露された六価クロムは、鼻中隔穿孔及び肺がんを起こす。"
      },
      {
        "key": 2,
        "text": "カドミウムは、中枢神経系に移行し、視野狭窄及び運動失調を起こす。"
      },
      {
        "key": 3,
        "text": "フェノトリンは、ナトリウムチャネルを開放状態にして、神経伝達を阻害する。"
      },
      {
        "key": 4,
        "text": "グリホサートは、アセチルコリンエステラーゼを阻害して副交感神経の興奮を起こす。"
      },
      {
        "key": 5,
        "text": "2,3,7,8-テトラクロロジベンゾ-ρ-ジオキシンは、プレグナンX受容体（PXR）に結合し、種々の遺伝子の転写を活性化する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nカドミウムの慢性毒性として、腎障害（特に近位尿細管障害）が代表的であり、尿中カルシウム排泄増加による骨軟化症を引き起こす。なお、視野狭窄や運動失調は、メチル水銀が引き起こす症状である。\n\n３　正\n\nフェノトリンは、ピレスロイド系殺虫剤であり、ナトリウムチャネルの閉鎖を遅延させて（開放状態にして）、神経伝達を阻害する作用を持つ。 なお、ヒトにおいてはカルボキシルエステラーゼによる加水分解を受けるため、比較的毒性が現れにくい。\n\n４　誤\n\nグリホサートは、含リンアミノ酸系除草剤であり、アセチルコリンエステラーゼ阻害作用はなく、植物のアミノ酸合成を阻害することによって除草効果を示す。なお、有機リン系殺虫剤やカルバメート系殺虫剤は、アセチルコリンエステラーゼを阻害して副交感神経の興奮を引き起こす。\n\n５　誤\n\n2,3,7,8-テトラクロロジベンゾ-p-ダイオキシン（TCDD）は、炭化水素受容体（AhR）に結合して種々の遺伝子発現を調節する。なお、リファンピシンは、プレグナンX受容体に結合し、代謝酵素やトランスポーターの発現を促進する。",
    "tags": []
  },
  {
    "id": "r110-132",
    "year": 110,
    "question_number": 132,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "活性酸素による傷害を防ぐための生体防御因子に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "カタラーゼは、過酸化水素を水と酸素に分解する。"
      },
      {
        "key": 2,
        "text": "スーパーオキシドジスムターゼは、活性中心にヘム鉄をもつ。"
      },
      {
        "key": 3,
        "text": "グルタチオンペルオキシダーゼは、活性中心にマンガンをもつ。"
      },
      {
        "key": 4,
        "text": "β-カロテンは、体内で代謝されるビタミンAとなる。"
      },
      {
        "key": 5,
        "text": "ビタミンEは、主に細胞質で抗酸化作用を示す。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nヒトの細胞質および赤血球に存在するスーパーオキシドジスムターゼ（SOD）は、構造中に銅（Cu）と亜鉛（Zn）を含むCu/Zn-SODである。また、ミトコンドリアに存在するSODは、構造中にマンガン（Mn）を含むMn-SODである。なお、一部の細菌や植物の葉緑体には、活性中心に鉄を含むFe-SODがあるが、活性中心には非ヘム鉄を有する。\n\n３　誤\n\nグルタチオンペルオキシダーゼ（GPx）は、活性中心にセレン（Se）を含む酵素であり、グルタチオンの存在下で、過酸化水素（H2O2）を水（H2O）に還元する。\n\n４　正\n\nβ-カロテンは、カロテノイドの一種であり、体内でビタミンAの前駆体（プロビタミンA）として機能する。β-カロテンは、腸粘膜のβ-カロテン開裂酵素によって分解され、1分子から2分子のビタミンAが生成される。\n\n５　誤\n\nビタミンEは、脂溶性ビタミンであり、主に細胞膜（細胞内小器官の膜も含む）のリン脂質二重層に局在し、特に生体膜やリポタンパク質を構成する高度不飽和脂肪酸の酸化を防ぐ抗酸化作用を発揮する。",
    "tags": []
  },
  {
    "id": "r110-133",
    "year": 110,
    "question_number": 133,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "問 133        中毒原因物質とスクリーニング試験（試験方法または検査試薬）の組合せのう\nち、正しいのはどれか。2つ選べ。\n中毒原因物質                                   試験方法または検査試薬\nH\nN\n1                                  CH3              ピリジン︲ピラゾロン法\nCH3\nCH3\nH N\n2                      H                            クロモトロープ酸法\nHO            O H H OH\nH\nO         N       O\nH3C\n3                              NH                   銅︲ピリジン法\nO\nOH\nO\n4                                                   ラインシュ法\nH3C       N\nH\nCH3\nOH\nH\n5                                                   デュケノア試薬\nH\nH3C   O                             CH3\nH3C",
    "choices": [
      {
        "key": 1,
        "text": "CH3              ピリジン︲ピラゾロン法 CH3"
      },
      {
        "key": 2,
        "text": "H                            クロモトロープ酸法"
      },
      {
        "key": 3,
        "text": "NH                   銅︲ピリジン法"
      },
      {
        "key": 4,
        "text": "ラインシュ法 H3C       N"
      },
      {
        "key": 5,
        "text": "デュケノア試薬"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-134",
    "year": 110,
    "question_number": 134,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "化学物質のin vitro遺伝毒性試験に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "細菌を用いる復帰突然変異試験は、試験菌株の表現型がアミノ酸非要求性に復帰することを利用する方法である。"
      },
      {
        "key": 2,
        "text": "マウスリンフォーマTK（チミジンキナーゼ）試験は、突然変異によりコロニーが形成されなくなることを利用する方法である。"
      },
      {
        "key": 3,
        "text": "小核試験は、塩基対置換型の点突然変異を検出する方法である。"
      },
      {
        "key": 4,
        "text": "コメットアッセイは、切断されたDNAの電気泳動における移動度が小さくなることを利用して遺伝毒性を検出する方法である。"
      },
      {
        "key": 5,
        "text": "不定期DNA合成試験は、損傷したDNAの修復合成を測定する方法である。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nマウスリンフォーマTK（チミジンキナーゼ）試験は、哺乳類培養細胞を用いて突然変異誘発性を検出する試験である。突然変異でチミジンキナーゼ（TK）遺伝子に欠損が起こると、選択培地中（TFT（トリフルオロチミジン）含有培地）で生残できるコロニーが形成されることを利用する。\n\n３　誤\n\nin vitro小核試験は、哺乳類培養細胞を用いて、染色体異常誘発性を検出する試験である。なお、塩基対置換型の点突然変異を検出する方法として、復帰突然変異試験が用いられる。\n\n４　誤\n\nin vitroコメットアッセイは、切断されたDNAの電気泳動での移動距離が大きくなることを利用し、DNA損傷性を検出する方法である。\n\n５　正\n\n不定期DNA合成試験（UDS試験）は、哺乳類培養細胞を用いてDNA損傷後の修復DNA合成を評価する方法である。被験物質で傷ついたDNAを細胞が修復する時に新たに作られる部分的なDNA（修復DNA）に放射性チミジン、ビチニル化チミジンがどれくらい取り込まれるかを測定し、DNA損傷性を評価する試験である。",
    "tags": []
  },
  {
    "id": "r110-135",
    "year": 110,
    "question_number": 135,
    "section": "理論",
    "subject": "薬理",
    "category": "",
    "question_text": "ある輸入果実が農薬Aで汚染されていることが判明し、その残留濃度は0.05 ppmであった。我が国では、この果実に対して、農薬Aの個別の残留基準値は設定されていない。また、農薬Aの許容一日摂取量（ADI）は0.029mg/kg体重/日、急性参照用量（ARfD）は0.3 mg/kg体重である。農薬Aのリスク評価及びリスク管理に関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ARfDは、24時間又はそれより短時間の経口摂取でヒトの健康に悪影響を示さないと推定される体重1kg当たりの摂取量である。"
      },
      {
        "key": 2,
        "text": "ARfDは、慢性毒性試験で得られる最大無作用量（NOAEL）又は最小作用量（LOAEL）を安全係数で除して求められる。"
      },
      {
        "key": 3,
        "text": "ADIは、非意図的汚染物質をヒトが一生涯にわたって摂取し続けても健康への悪影響がないと考えられる体重1kg当たり、1日当たりの摂取量である。"
      },
      {
        "key": 4,
        "text": "体重50kgの成人がこの果実を仮に毎日40kg食べ続けても、農薬AのADIを超える摂取量とはならない。"
      },
      {
        "key": 5,
        "text": "一律基準（01 ppm）が適用されるため、この果実を販売することは食品衛生法違反である。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nARfDは、短期の毒性試験（急性毒性試験など）で健康に影響が現れなかった量を安全係数で除して求められる。\n\n３　誤\n\n許容一日摂取量（ADI）は、人が一生涯にわたって毎日摂取しても健康に有害な影響がない量であり、1日当たり体重1kgあたりの量として表される。ADIは、意図的に使用される化学物質（食品添加物、農薬など）に設定する。\n\n４　誤\n\nこの果実を40kg/日摂取すると、1日あたりの農薬Aの摂取量は2mg/日（40kg/日×0.05ppm＝2mg/日）となる。体重50kgの成人の場合、体重1kg当たりの農薬Aの摂取量は、0.04mg/kg体重/日（2mg/日÷50kg＝0.04mg/kg体重/日）となる。これらのことより、農薬AのADIである0.029mg/kg体重／日を超える摂取量となる。\n\n５　正\n\n食品衛生法において、個別に残留基準が設定されていない農薬には、一律基準（0.01ppm）が適用される。今回、輸入された果実における農薬Aの残留濃度が0.05ppmであることから、この果実を販売することは食品衛生法違反となる。",
    "tags": []
  },
  {
    "id": "r110-136",
    "year": 110,
    "question_number": 136,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "電離放射線による人体への影響及び評価基準に関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "吸収線量は、物質1kg当たりに、1Jのエネルギーを吸収した際に物質が受けた線量を1Gyと定義されている。"
      },
      {
        "key": 2,
        "text": "実効線量は、確定的影響のしきい値を規定するのに用いられる。"
      },
      {
        "key": 3,
        "text": "等価線量は、全身の被ばくの影響を評価するための指標で、各組織又は臓器当たりの吸収線量に組織加重係数を掛けて、合計して算出する。"
      },
      {
        "key": 4,
        "text": "等価線量を求めるのに用いられる放射線加重係数は、γ線よりα線の方が大きい。"
      },
      {
        "key": 5,
        "text": "「時間」、「距離」、「遮蔽」の防御の３原則は、内部被ばくの低減に重要である。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n実効線量は、確率的影響（確率的影響：がん・遺伝的影響など）を評価する指標であり、確定的影響（しきい値が存在する影響：皮膚障害、白内障など）を評価する指標には用いられない。実効線量とは、等価線量に組織加重係数を考慮して合算した全身への被曝の影響を表す指標であり、その単位はシーベルト（Sv）である。\n\n３　誤\n\n等価線量は、各組織又は臓器への被曝の影響を評価するための指標であり、放射線の種類による生体影響の違いを補正するために、吸収線量に放射線加重係数を掛けたものである。組織加重係数は「実効線量」の算出に用いるものであり、等価線量の計算には用いられない。\n\n４　正\n\n生物学的効果は、γ線よりα線の方が高いため、放射線加重係数（放射線の種類による生体影響の強さ）は、γ線よりα線の方が大きい。\n\n５　誤\n\n「時間」「距離」「遮蔽」の放射線防護の3原則は、外部被ばくの低減に重要である。",
    "tags": []
  },
  {
    "id": "r110-137",
    "year": 110,
    "question_number": 137,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "地球環境の保全に関する国際的な取組みに関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "水銀に関する水俣条約では、水銀化合物及び水銀化合物を使用した製品の製造と輸出入が規制されている。"
      },
      {
        "key": 2,
        "text": "生物の多様性に関する条約カルタヘナ議定書では、絶滅のおそれのある野生動植物の種の国際取引が規制されている。"
      },
      {
        "key": 3,
        "text": "残留性有機汚染物質に関するストックホルム条約では、クロロフルオロカーボン及びハイドロクロロフルオロカーボンなど残留性有機化合物の使用が規制されている。"
      },
      {
        "key": 4,
        "text": "ロンドン条約1996年議定書では、廃棄物等の海洋投棄及び洋上焼却が規制されている。"
      },
      {
        "key": 5,
        "text": "オゾン層を破壊する物質に関するモントリオール議定書では、温室効果ガスである二酸化炭素排出量の削減目標が定められている。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nカルタヘナ議定書は、遺伝子組換え技術で改変された生物が生物多様性に悪影響を与えないようにすることを目的としている。なお、ワシントン条約は、絶滅の危機にある野生動植物の国際取引を規制するための条約である。\n\n３　誤\n\nストックホルム条約（POPs条約）は、ポリ塩化ビフェニル（PCB）やジクロロジフェニルトリクロロエタン（DDT）、ダイオキシン類など、環境中で分解されにくい残留性有機汚染物質（POPs）の製造や使用を原則として禁止し、さらに非意図的に発生する排出も抑制することを定めている。\n\nなお、クロロフルオロカーボンやハイドロクロロフルオロカーボンは、オゾン層を破壊する特定フロンに分類される。\n\n４　正\n\nロンドン条約は、主に陸上発生の廃棄物その他の海洋投棄及び洋上焼却について規制されている。\n\n５　誤\n\nモントリオール議定書は、ウィーン条約をもとにオゾン層を守ることを目的としており、オゾン層を破壊する可能性がある物質を指定して、その生産や使用を規制している。\n\n一方、地球温暖化対策としてのパリ協定では、温室効果ガス（二酸化炭素など）の排出削減目標が設定されている。",
    "tags": []
  },
  {
    "id": "r110-138",
    "year": 110,
    "question_number": 138,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "下図は、薬品沈殿−急速ろ過方式の浄水過​​程を模式的に示したものである。次の記述のうち、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "Aの段階で前塩素処理を追加すると、アンモニア態窒素を除去したり、藍藻類の繁殖を抑制したりすることができる。"
      },
      {
        "key": 2,
        "text": "Bの段階で中塩素処理、次いで粒状活性炭処理を追加すると、生物膜を形成した生物活性炭による有機物の除去に有効である。"
      },
      {
        "key": 3,
        "text": "急速ろ過の過程では、主に砂層及び石礫層に繁殖した微生物によって有機物が除去される。"
      },
      {
        "key": 4,
        "text": "Cの段階でオゾン処理及び粒状活性炭処理を追加すると、溶解性の有機物や臭気物質の除去に有効である。"
      },
      {
        "key": 5,
        "text": "トリハロメタン前駆物質の除去を目的として、Dの段階で粉末活性炭を注入する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nBの段階で中塩素（中間塩素）処理の後に活性炭処理を行うと、残った塩素の殺菌作用で生物膜ができにくくなるため、生物活性炭処理の効果は期待できない。一方、活性炭処理の後に中間塩素処理を行うと、活性炭に微生物が付着して生物膜を作ることができ、生物活性炭として有機物の除去を行うことが可能となる。\n\n３　誤\n\n急速ろ過の過程では、砂層及び石礫層に繁殖した微生物による生物ろ過膜は形成されない。そのため、本法では、微生物による有機物の除去効果はほとんど認められない。一方、緩速ろ過の過程では、生物ろ過膜が形成されるため、微生物による有機物の除去効果が認められる。\n\n４　正\n\nCの段階でオゾン処理と粒状活性炭処理を追加すると、オゾンの強い酸化力と活性炭の吸着作用によって、原水中に含まれる溶解性の有機物やにおいの原因物質を分解・除去するのに効果的である。\n\n５　誤\n\nフミン質のようなトリハロメタンの前駆物質を除去する目的で活性炭を使用するのはA段階である。フミン質は塩素処理を受けるとクロロホルムなどのトリハロメタンに変わってしまうため、塩素処理が終わった後のDの段階で活性炭を入れても、トリハロメ",
    "tags": [],
    "image_url": "/images/questions/110/q138.png"
  },
  {
    "id": "r110-139",
    "year": 110,
    "question_number": 139,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "環境汚染（大気汚染、水質汚濁、土壌汚染等）を防止するための法規制に関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "大気汚染防止法では、自動車などの移動発生源から排出されるばい煙や揮発性有機化合物及び粉じんについて排出基準が定められている。"
      },
      {
        "key": 2,
        "text": "水質汚濁防止法では、健康に係る有害物質及び生活環境に係る汚染状態について排水基準が定められている。"
      },
      {
        "key": 3,
        "text": "都道府県は、国が定めた一般排水基準あるいは一律排水基準よりも厳しい「上乗せ排出基準」あるいは「上乗せ排水基準」を定めることができる。"
      },
      {
        "key": 4,
        "text": "土壌汚染対策法では、すべての特定有害物質について「土壌含有基準」が定められている。"
      },
      {
        "key": 5,
        "text": "ダイオキシン類対策特別措置法では、大気、水質、土壌及び農作物を対象に環境基準が定められている。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n大気汚染防止法では、工場や事業所などの固定発生源から排出されるばい煙、揮発性有機化合物および粉じんに対して排出基準が定められている。ばい煙の排出基準として、「一般基準」「特別基準」「上乗せ基準」「総量規制」の4区分がある。\n\n２　正\n\n水質汚濁防止法の目的は、工場や事業場から公共用水域の排水や地下水へ有害な物質が浸透するのを防ぐことにより、公共用水域及び地下水の水質汚濁を防止することである。本法では、健康に影響する有害物質や、生活環境に関わる項目について排水基準が定められている。なお、有害物質の中でもアルキル水銀化合物は検出されないことと定められている。\n\n３　正\n\n水質汚濁防止法による基本の排出基準だけで対策が不十分な地域に対して、都道府県が条例で「上乗せ排出基準」や「より厳しい排出規制」を設けることができる。\n\n４　誤\n\n土壌汚染対策法では、すべての特定有害物質について「土壌溶出量基準」が定められているが、「土壌含有量基準」は一部の物質に対してのみ設定されている。\n\n５　誤\n\nダイオキシン類対策特別措置法では、「大気、水質、土壌、底質」に関しては環境基準が定められている。",
    "tags": []
  },
  {
    "id": "r110-140",
    "year": 110,
    "question_number": 140,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "下図の汚染物質A～Cは、全国の一般環境大気測定局における窒素酸化物、二酸化硫黄又は光化学オキシダントのいずれかの季節変動を示したものである。汚染物質A～Cに関する記述のうち、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "汚染物質Aは、揮発性有機化合物や非メタン炭化水素に太陽光、特に紫外線が照射されることによって生成する。"
      },
      {
        "key": 2,
        "text": "汚染物質Bは、移動発生源である自動車のほかに、一般家庭で使用される燃焼器具も発生源となる。"
      },
      {
        "key": 3,
        "text": "汚染物質Cは、主に固定発生源における化石燃料の燃焼によって生成する。"
      },
      {
        "key": 4,
        "text": "汚染物質Aの測定には、ザルツマン法が用いられる。"
      },
      {
        "key": 5,
        "text": "汚染物質Cの測定には、中性ヨウ化カリウム法が用いられる。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nA（二酸化硫黄）は石炭や重油に含まれる硫黄分が燃焼により酸化されて発生する。\n\n２　正\n\nB（窒素酸化物）は、自動車（移動発生源）や工場（固定発生源）だけでなく、家庭で使う暖房器具などからも発生する。\n\n３　誤\n\nC（光化学オキシダント）は、固定・移動発生源から排出されたVOCや非メタン炭化水素、NOxが太陽光（特に紫外線）を受けて生成する二次汚染物質である。\n\n４　誤\n\nA（二酸化硫黄）の測定法として、溶液導電率法や紫外線蛍光法が用いられる。なお、B（窒素酸化物）の測定法として、ザルツマン法が用いられる。\n\n５　正\n\nC（光化学オキシダント）の測定法として、中性ヨウ化カリウム法が用いられる。",
    "tags": [],
    "image_url": "/images/questions/110/q140.png"
  },
  {
    "id": "r110-141",
    "year": 110,
    "question_number": 141,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "薬剤師の免許の取消し等に関する記述として、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "薬剤師業務の停止期間は、3年以内である。"
      },
      {
        "key": 2,
        "text": "戒告処分を受けた場合、再教育研修の対象になる。"
      },
      {
        "key": 3,
        "text": "処分にあたっては、社会保障審議会の意見を聴かなければならない。"
      },
      {
        "key": 4,
        "text": "薬剤師が認知症の診断を受けた場合、絶対的欠格事由として免許が取り消される。"
      },
      {
        "key": 5,
        "text": "薬剤師免許を取り消された者が、再び免許を取得しようとする場合は、改めて国家試験を受けて合格する必要がある。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　正\n\n厚生労働大臣は、戒告もしくは3年以内の業務停止処分を受けた薬剤師、又は免許取消処分を受けた後に再び免許取得を希望する者に対して、再教育研修の受講を命じることができる。\n\n３　誤\n\n薬剤師の処分にあたって、厚生労働大臣は医道審議会の意見を必ず聞かなければならない。\n\n４　誤\n\n薬剤師法における絶対的欠格事由は未成年者のみである。なお、薬剤師が認知症と診断され、その症状が業務遂行に支障をきたすと判断された場合には、相対的欠格事由に該当するとして、薬剤師免許が取り消される可能性がある。\n\n５　誤\n\n薬剤師免許を取り消された者が、再び免許を取得しようとする場合、改めて国家試験を受ける必要はない。再免許にあたっては、処分の内容や経過期間、再教育研修の受講状況などを総合的に判断した上で、厚生労働大臣は再び免許を与えることができる。",
    "tags": []
  },
  {
    "id": "r110-142",
    "year": 110,
    "question_number": 142,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "薬局の開設者が、患者の同意なしでも患者の個人情報を第三者に提供できるのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "患者が通学する学校の養護教諭から、今後の健康管理のため患者の処方薬について照会があった場合"
      },
      {
        "key": 2,
        "text": "民間保険会社から、保険加入の勧誘のため患者の連絡先について照会があった場合"
      },
      {
        "key": 3,
        "text": "患者が意識不明で緊急搬送された医療機関から、患者の薬剤服用歴について照会があった場合"
      },
      {
        "key": 4,
        "text": "服薬指導時に得た患者情報から処方内容に疑義が生じ、処方医に照会する場合"
      },
      {
        "key": 5,
        "text": "患者が勤める勤務先から、健康状態の確認のため既往歴について照会があった場合"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\n患者が通学する学校の養護教諭からの照会は、第三者への情報提供に該当するため、原則として本人または保護者の事前同意がなければ情報提供してはならない。\n\n２　誤\n\n民間保険会社からの連絡先照会は、第三者への情報提供に該当するため、原則として本人または保護者の事前同意がなければ情報提供してはならない。\n\n３　正\n\n患者が意識不明で緊急搬送された医療機関からの照会は、人の生命・身体の保護を目的とし、本人の同意を得ることが困難である場合に該当する。よって、例外的に本人の同意なく情報提供が可能である。\n\n４　正\n\n処方内容に疑義がある場合、薬剤師が処方医に確認する行為は薬剤師法に基づく職務上の義務であり、第三者への情報提供には該当せず、本人の同意も不要である。これは調剤ミスを防ぐための正当な職務行為として法律で明示されている。\n\n５　誤\n\n患者の勤務先からの照会は、第三者への情報提供にあたるため、あらかじめ本人の同意がない場合は情報提供を行ってはならない。",
    "tags": []
  },
  {
    "id": "r110-143",
    "year": 110,
    "question_number": 143,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "医薬品医療機器等法における再生医療等製品に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "動物の細胞に、培養その他の加工を施したものは該当しない。"
      },
      {
        "key": 2,
        "text": "人の体内で発現する遺伝子を含有させたものは該当しない。"
      },
      {
        "key": 3,
        "text": "製造販売業者は、感染症定期報告を行わなければならない。"
      },
      {
        "key": 4,
        "text": "再生医療等製品取扱医療関係者は、使用の対象者に対し適切な説明を行い、同意を得て使用するよう努めなければならない。"
      },
      {
        "key": 5,
        "text": "医薬品副作用被害救済制度の対象ではない。"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\n動物の細胞に培養や加工を施したものは、再生医療等製品に該当する。\n\n２　誤\n\n人の体内で発現する遺伝子を含有させたものは、再生医療等製品に該当する。\n\n３　正\n\n再生医療等製品や生物由来製品の製造販売業者は、感染症定期報告制度の対象者として、感染症に関連する情報を評価し、厚生労働大臣またはPMDAに定期的に報告する義務がある。\n\n４　正\n\n再生医療等製品を取り扱う医療従事者は、使用の対象者に対して有効性、安全性、使用上の注意点等を十分に説明し、同意を得たうえで使用に努めなければならない。\n\n５　誤\n\n再生医療等製品は、医薬品副作用被害救済制度の対象に含まれている。本制度は、「許可された医薬品」または「許可された再生医療等製品」を適正に使用したにもかかわらず発生した健康被害を救済する制度である。",
    "tags": []
  },
  {
    "id": "r110-144",
    "year": 110,
    "question_number": 144,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "医薬品医療機器等法に基づく薬局管理者の義務はどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "薬局に勤務する薬剤師その他の従業員を監督しなければならない。"
      },
      {
        "key": 2,
        "text": "薬局の構造設備及び医薬品その他の物品を管理しなければならない。"
      },
      {
        "key": 3,
        "text": "薬局の前年における総取扱処方箋枚数を都道府県知事に届け出なければならない。"
      },
      {
        "key": 4,
        "text": "薬局開設許可証を薬局の見やすい場所に掲示しなければならない。"
      },
      {
        "key": 5,
        "text": "薬局開設者に対する必要な意見を書面に残す場合は、薬局開設者の許可を受けなければならない。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　正\n\n薬局の構造設備や、医薬品・医療機器などの物品について適切に管理することは、薬局管理者に求められる重要な責務である。\n\n３　誤\n\n薬局の年間の処方箋受付枚数を都道府県知事に報告する義務は、薬局開設者の責務であり、薬局管理者には課されていない。\n\n４　誤\n\n薬局開設許可証を見やすい場所に掲示するのは、薬局開設者の義務である。管理者の業務には含まれない。\n\n５　誤\n\n薬局管理者は、薬局開設者に対して必要な意見を文書で提出する義務があるが、その際に開設者の許可を得る必要はない。",
    "tags": []
  },
  {
    "id": "r110-145",
    "year": 110,
    "question_number": 145,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "劇薬の取扱いについて、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "貯蔵又は陳列の際には、他の医薬品と区別して貯蔵し、又は陳列しなければならない。"
      },
      {
        "key": 2,
        "text": "貯蔵する場所には、かぎを施さなければならない。"
      },
      {
        "key": 3,
        "text": "18歳未満の者に交付してはならない。"
      },
      {
        "key": 4,
        "text": "劇薬を譲渡する際に譲受人から交付される文書には、品名、数量、使用目的等の記載が必要である。"
      },
      {
        "key": 5,
        "text": "譲受人から交付された文書の譲渡人による保存期間は、譲渡の日から3年間である。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n劇薬を保管する場所には施錠義務はない。一方、毒薬を保管する場合は、施錠が必要である。\n\n３　誤\n\n劇薬および毒薬は、14歳未満の者や、安全な取扱いが困難であると判断される者には交付してはならない。なお、18歳未満の者に交付することができないのは、劇物、毒物である。\n\n４　正\n\n劇薬または毒薬を販売・交付する際は、購入者から文書を受け取り、その文書に品名・数量・使用目的など必要事項を記載することが義務付けられている。\n\n５　誤\n\n劇薬に関する文書の保存期間は、譲渡した日から2年間と定められている。",
    "tags": []
  },
  {
    "id": "r110-146",
    "year": 110,
    "question_number": 146,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "医療法に基づく医療事故調査制度における医療事故の対応に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "報告先は、独立行政法人医薬品医療機器総合機構（PMDA）である。"
      },
      {
        "key": 2,
        "text": "対象となる医療事故は、医療に起因する入院治療を必要とする程度の健康被害である。"
      },
      {
        "key": 3,
        "text": "病院の管理者は、病院の開設許可権者に申し出て、医療事故に該当するか否かの判定を受けなければならない。"
      },
      {
        "key": 4,
        "text": "病院の管理者は、医療事故が発生した場合、遅延なく、定められた報告先に報告しなければならない。"
      },
      {
        "key": 5,
        "text": "病院の管理者は、医療事故が発生した場合、原因を明らかにするために調査を行わなければならない。"
      }
    ],
    "correct_answer": 4,
    "explanation": "２　誤\n\n医療事故調査制度の対象となる「医療事故」は、以下の3つの要件をすべて満たすものである。\n\n①医療に起因し、または医療と相当因果関係があることが疑われること\n\n②患者が死亡または死産したこと\n\n③医療機関内で発生したこと\n\n３　誤\n\n医療事故に該当するか否かの判断は、病院等の管理者が自ら行う。\n\n４　正\n\n医療事故が発生した際、病院等の管理者は、事故の発生日、場所、状況などを速やかに医療事故調査・支援センターへ報告する義務がある。\n\n５　正\n\n病院等の管理者は、医療事故が発生した場合、その原因を明らかにするため、医療機関内で調査を実施する義務がある。この調査は責任追及を目的とするものではなく、医療の質と安全性の向上、再発防止を目的とした制度である。",
    "tags": []
  },
  {
    "id": "r110-147",
    "year": 110,
    "question_number": 147,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "我が国の医療保険制度に関する記述として、正しいのはどれか。２つ選べ。なお、公費負担医療を受けている場合を除く。",
    "choices": [
      {
        "key": 1,
        "text": "国民は公的保険に加入しなければならない。"
      },
      {
        "key": 2,
        "text": "保険者が支払う療養の給付に関する費用は、被保険者が支払う一部負担金を除いた残額である。"
      },
      {
        "key": 3,
        "text": "75歳以上の被保険者が支払う一部負担金の割合は、所得に関わらず同じである。"
      },
      {
        "key": 4,
        "text": "健康保険の被保険者が扶養する配偶者や子供は、国民健康保険に加入しなければならない。"
      },
      {
        "key": 5,
        "text": "健康保険では、勤務中や業務により発生した病気や怪我等を対象に療養の給付を行う。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　正\n\n医療費のうち、保険適用となる診療・投薬・手術などにかかる費用は、被保険者が自己負担する一部負担金を差し引いた残りの額を保険者が支払うことになっている。\n\n３　誤\n\n　75歳以上の高齢者は、原則として後期高齢者医療制度に加入する。この制度では、一部負担金の割合は全国一律ではなく、被保険者の所得に応じて1割・2割・3割と異なるため、「一律同じである」という記述は誤りである。\n\n４　誤\n\n健康保険（被用者保険）では、被扶養者制度があり、被保険者が生計を維持している配偶者や子どもは本人と同じ保険に加入できる。したがって、別途国民健康保険に加入する必要はない。\n\n※ただし、国民健康保険には被扶養者制度はないため、配偶者や子どもも個別に保険料を支払って加入する。\n\n５　誤\n\n健康保険は、業務以外で発生した疾病や負傷、出産、死亡などに対する給付制度であり、業務災害は給付の対象外である。なお、労働中や通勤中に発生した負傷や疾病は、健康保険ではなく労災保険（業務災害・通勤災害）によって給付される。",
    "tags": []
  },
  {
    "id": "r110-148",
    "year": 110,
    "question_number": 148,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "評価対象医薬品Aは比較対照医薬品Bと比べて追加的有用性が示されており、費用効用分析を行うこととなった。 分析の結果、増分費用効果比（ICER）は「200万円/QALY」であった。分析結果の記述として、正しいのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "Aに切り替えずBを使用する場合、1QALY当たり200万円の費用を削減できる。"
      },
      {
        "key": 2,
        "text": "Bを使用してAと同等のQALYを得るには、200万円の費用の追加が必要である。"
      },
      {
        "key": 3,
        "text": "Aに切り替えずBを使用することによって、1QALYの減少に伴い、200万円の費用の削減ができる。"
      },
      {
        "key": 4,
        "text": "BからAに切り替える場合、1QALY当たり200万円の費用を削減できる。"
      },
      {
        "key": 5,
        "text": "BからAに切り替えることによって、1QALYを追加的に得るのに200万円の費用の追加が必要である。"
      }
    ],
    "correct_answer": 5,
    "explanation": "したがって、\n\nICER ＝ 1億円 ÷ 50 QALY ＝ 200万円／QALY\n\nこの結果は、BからAへ変更することで1QALY（質調整生存年）を得るために200万円の追加費用が必要であることを意味する。\n\n１　誤\n\nICERは「追加費用」を示す指標であり、費用の削減を意味するものではない。\n\n２　誤\n\n　AとBではQALYに差があるため、同等のQALYを得ることはできない。\n\n３　誤\n\n解説１参照\n\n４　誤\n\n解説１参照\n\n５　正\n\n前記参照",
    "tags": [],
    "image_url": "/images/questions/110/q148.png"
  },
  {
    "id": "r110-149",
    "year": 110,
    "question_number": 149,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "我が国の医療薬分業について正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "いわゆる医薬分業率とは、全患者のうち投薬が必要とされた患者への処方件数に対する院外処方箋枚数の割合である。"
      },
      {
        "key": 2,
        "text": "都道府県による医薬分業率の地域差は、令和元年（2019年）以降認められなくなった。"
      },
      {
        "key": 3,
        "text": "かかりつけ薬局において薬歴管理を行うことにより、重複投薬や相互作用の有無の確認ができ、薬物療法の有効性・安全性の向上が期待される。"
      },
      {
        "key": 4,
        "text": "西洋の医療制度が導入された明治2年（1869年）を医薬分業元年として、急速に分業が進んだ。"
      },
      {
        "key": 5,
        "text": "医師は、患者に必要な医薬品を病院・診療所にある医薬品に限定されることなく処方することなく処方することができる。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n都道府県によって医薬分業率には依然として大きな差が存在している。なお、令和5年度の処方せん受取率は、最高の県で約92%、最低の県で約62%であり、都道府県によって大きな差がある。\n\n３　正\n\n医薬分業のメリットとして、かかりつけ薬剤師・薬局による服薬情報の一元化や継続的な管理が行われ、多剤投与や重複投薬の防止、安全性向上が期待できる。これは医薬分業が推進される理由の一つである。\n\n４　誤\n\n医薬分業は、1974年（昭和49年）の医療機関の診療報酬の見直しであり、そこから院外処方の普及が急速に進んだ。\n\n５　正\n\n医薬分業制度により、処方は医師が行い、調剤・供給は薬剤師が担う。これにより、処方は病院内の在庫に縛られず、医学的判断に基づいて最適な薬を選べるようになった。このことは医薬分業の大きなメリットの一つである。",
    "tags": []
  },
  {
    "id": "r110-150",
    "year": 110,
    "question_number": 150,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "薬剤師と実務実習の会話である。会話内容に関する記述として適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "①で薬剤師は、実務実習生が考えや気持ちを話せるように、閉じた質問を行った。"
      },
      {
        "key": 2,
        "text": "②での実践実習生は、言語コミュニケーションがうまくできなかったことを伝えた。"
      },
      {
        "key": 3,
        "text": "③で薬剤師は、実務実習生の話を理解していることを伝えるために、実務実習生が話した内容を共感的に繰り返した。"
      },
      {
        "key": 4,
        "text": "④で薬剤師は、Positive・Negative・Positiveを活用してフィードバックした。"
      },
      {
        "key": 5,
        "text": "実務実習生は、薬剤師との会話の中で終始、非主張的な反応を示していた。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n実務実習生が②で述べたのは、「患者さんの目をあまり見られませんでした」という内容である。\n\nこれは視線を合わせられなかったことに関するものであり、非言語コミュニケーション（視線・態度など）の困難を示している。したがって、「言語コミュニケーションがうまくできなかった」とする記述は不適切である。\n\n３　正\n\n薬剤師が「緊張して患者さんの目を見てお話ができなかったと感じているのですね」と繰り返し、共感を示した点は、実習生の気持ちに寄り添う共感的リスニング（アクティブリスニング）の好例である。\n\n４　正\n\n薬剤師は、最初に「非常に良かった」と肯定的に評価し（Positive）、次に「目を見て話せなかった点は改善点である」と課題を示し（Negative）、最後に「気持ちに寄り添って話そうとしたのは素晴らしかった」ともう一度ポジティブに評価した（Positive）。これはいわゆるPositive–Negative–Positive形式のサンドイッチ型フィードバックであり、適切な対応である。\n\n５　誤\n\n実習生は「ありがとうございました」「次回は意識してみます」と感謝と前向きな姿勢を示して",
    "tags": [],
    "image_url": "/images/questions/110/q150.png"
  },
  {
    "id": "r110-151",
    "year": 110,
    "question_number": 151,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "細胞内情報伝達系に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ドパミンD2受容体が刺激されると、Giタンパク質を介してアデニル酸シクラーゼ活性が抑制される。"
      },
      {
        "key": 2,
        "text": "グルタミン酸NMDA受容体が刺激されると、Ca2＋の細胞膜透過性が亢進される。"
      },
      {
        "key": 3,
        "text": "γ-アミノ酪酸GABAB受容体が刺激されると、Cl－の細胞膜透過性が亢進される。"
      },
      {
        "key": 4,
        "text": "グルカゴン受容体が刺激されると、受容体型チロシンキナーゼが活性化される。"
      },
      {
        "key": 5,
        "text": "インスリン受容体が刺激されると、膜結合型グアニル酸シクラーゼが活性化される。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　正\n\nグルタミン酸NMDA受容体は、Na＋、K＋、Ca2＋チャネル内蔵型受容体であり、グルタミン酸NMDA受容体が刺激されると、Ca2＋の細胞膜透過性が亢進される。\n\n３　誤\n\nγ-アミノ酪酸GABAB受容体は、Giタンパク質共役型受容体であり、γ-アミノ酪酸GABAB受容体が刺激されると、Giタンパク質を介してアデニル酸シクラーゼ活性が抑制される。\n\n４　誤\n\nグルカゴン受容体は、Gsタンパク質共役型受容体であり、グルカゴン受容体が刺激されると、Gsタンパク質を介してアデニル酸シクラーゼ活性が促進される。\n\n５　誤\n\nインスリン受容体は、チロシンキナーゼ内蔵型受容体であり、インスリン受容体が刺激されると、受容体型チロシンキナーゼが活性化される。",
    "tags": []
  },
  {
    "id": "r110-152",
    "year": 110,
    "question_number": 152,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "自律神経系に作用する薬物に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アコチアミドは、アセチルコリンM1受容体を遮断して、胃酸分泌を抑制する。"
      },
      {
        "key": 2,
        "text": "セビメリンは、アセチルコリンM3受容体を刺激して、唾液分泌を促進させる。"
      },
      {
        "key": 3,
        "text": "サルブタモールは、アドレナリンβ1受容体を遮断して、子宮平滑筋を収縮させる。"
      },
      {
        "key": 4,
        "text": "ピンドロールは、アドレナリンβ2受容体を刺激して、気管支平滑筋を弛緩させる。"
      },
      {
        "key": 5,
        "text": "クロニジンは、アドレナリンα2受容体を刺激して、交感神経活動を抑制する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\nセビメリンは、アセチルコリンM3受容体を刺激して、唾液分泌を促進する。\n\n３　誤\n\nサルブタモールは、アドレナリンβ2受容体を刺激して、気管支平滑筋を弛緩させる。\n\n４　誤\n\nピンドロールは、非選択的にアドレナリンβ受容体を遮断し、心機能を抑制する。\n\n５　正\n\nクロニジンは、アドレナリンα2受容体を刺激して、交感神経活動を抑制する。",
    "tags": []
  },
  {
    "id": "r110-153",
    "year": 110,
    "question_number": 153,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "外科的手術時に用いられる薬物に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "血液／ガス分配係数の大きい吸入麻酔薬ほど、麻酔の導入は速い。"
      },
      {
        "key": 2,
        "text": "最小肺胞濃度（MAC）の大きい吸入麻酔薬ほど、麻酔作用は強い。"
      },
      {
        "key": 3,
        "text": "デクスメデトミジンは、アドレナリンα2受容体を刺激することで、鎮痛及び鎮静作用を生じる。"
      },
      {
        "key": 4,
        "text": "チアミラールは、γ-アミノ酪酸GABAA受容体のバルビツール酸結合部位に結合することで、意識消失を生じる。"
      },
      {
        "key": 5,
        "text": "ケタミンは、ヒスタミンH1受容体を遮断することで、不動化（筋弛緩）を起こす。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\n最小肺胞濃度（MAC）の大きい吸入麻酔薬ほど、麻酔作用は弱い。\n\n３　正\n\nデクスメデトミジンは、アドレナリンα2受容体を刺激することで、鎮痛及び鎮静作用を示す。\n\n４　正\n\nチアミラールは、γ-アミノ酪酸GABAA受容体のバルビツール酸結合部位に結合し、催眠・鎮静作用を示す。\n\n５　誤\n\nケタミンは、NMDA受容体を非競合的に阻害し、強い鎮静作用を示す。",
    "tags": []
  },
  {
    "id": "r110-154",
    "year": 110,
    "question_number": 154,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "抗てんかん薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ラコサミドは、電位依存性Na＋チャネルの緩徐な不活性化を促進して、神経細胞の過剰興奮を抑制する。"
      },
      {
        "key": 2,
        "text": "スルチアムは、電位依存性T型Ca 2＋チャネルを遮断して、欠神発作に特徴的な棘徐波複合の発生を抑制する。"
      },
      {
        "key": 3,
        "text": "スチリペントールは、シナプス小胞タンパク質2A（SV2A）に結合して、神経伝達物質の遊離を抑制する。"
      },
      {
        "key": 4,
        "text": "ビガバトリンは、γ-アミノ酪酸（GABA）トランスアミナーゼを不可逆的に阻害して、脳内GABA濃度を上昇させる。"
      },
      {
        "key": 5,
        "text": "ルフィナミドは、グルタミン酸AMPA受容体を非競合的に遮断して、神経細胞における活動電位の発生を抑制する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nスルチアムは、炭酸脱水酵素を阻害することで抗てんかん作用を示す。\n\n３　誤\n\nスチリペントールは、GABAの取り込みを阻害するとともにGABAトランスアミナーゼ活性を低下させることで抗てんかん作用を示す。\n\n４　正\n\nビガバトリンは、GABAアミノ基転移酵素を阻害し、脳内GABA濃度を増加させることで抗てんかん作用を示す。\n\n５　誤\n\nルフィナミドは、電位依存性Na＋チャネルの不活化状態からの回復を遅延させることで抗てんかん作用を示す。",
    "tags": []
  },
  {
    "id": "r110-155",
    "year": 110,
    "question_number": 155,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "抗アレルギー薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "スプラタストは、プロスタノイドTP受容体及びプロスタノイドDP2（CRTH2）受容体を遮断する。"
      },
      {
        "key": 2,
        "text": "プランルカストは、ロイコトリエンCysLT1受容体を遮断する。"
      },
      {
        "key": 3,
        "text": "シプロヘプタジンは、トロンボキサン合成酵素を阻害する。"
      },
      {
        "key": 4,
        "text": "ラマトロバンは、ヒスタミンH1受容体を遮断する。"
      },
      {
        "key": 5,
        "text": "デュピルマブは、IL-4受容体αサブユニットに結合して、IL-4及びIL-13の作用を抑制する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\nプランルカストは、ロイコトリエン受容体拮抗薬であり、ロイコトリエンCysLT1受容体を遮断する。\n\n３　誤\n\nシプロヘプタジンは、ヒスタミンH1受容体遮断薬であり、ヒスタミンH1受容体を遮断する。\n\n４　誤\n\nラマトロバンは、トロンボキサン受容体遮断薬であり、競合的にTXA2受容体を遮断する。\n\n５　正\n\nデュピルマブは、IL-4受容体複合体、IL-13受容体複合体に共通のIL-4受容体αサブユニットに特異的に結合し、IL-4、IL-13のシグナル伝達を阻害する。",
    "tags": []
  },
  {
    "id": "r110-156",
    "year": 110,
    "question_number": 156,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "63歳男性。慢性心不全と診断され、治療中である。その他の既往歴及び常用薬はない。あ\n問156（薬理）\n\n心不全治療薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ミルリノンは、ホスホジエステラーゼⅢ（PDEⅢ）を阻害して、心筋細胞内サイクリックAMP（cAMP）の分解を抑制する。"
      },
      {
        "key": 2,
        "text": "コルホルシンダロパートは、Na＋, K＋-ATPaseを阻害して、陽性の変力作用及び陰性の変時作用を示す。"
      },
      {
        "key": 3,
        "text": "イバブラジンは、ネプリライシンを阻害して、心房性ナトリウム利尿ペプチドの分解を抑制する。"
      },
      {
        "key": 4,
        "text": "カンデサルタンは、アンジオテンシンⅡAT₁受容体を遮断して、心筋のリモデリングを抑制する。"
      },
      {
        "key": 5,
        "text": "ベルイシグアトは、過分極活性化環状ヌクレオチド依存性（HCN）チャネルを遮断して、心拍数を減少させる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nコルホルシンダロパートは、心筋において、アデニル酸シクラーゼを直接活性化し、cAMP濃度を上昇させることにより心筋収縮力を増大させる。\n\n３　誤\n\nイバブラジンは、HCN（過分極活性化環状ヌクレオチド依存性）チャネルを阻害することにより、活動電位の拡張期脱分極相における立ち上がり時間を延長させ、心拍数を減少させる。\n\n４　正\n\nカンデサルタンは、アンジオテンシンⅡAT₁受容体を遮断し、心筋のリモデリングを抑制する。\n\n５　誤\n\nベルイシグアトは、可溶性グアニル酸シクラーゼを刺激し、cGMPの生成を促進することで心筋のリモデリングを抑制する。",
    "tags": []
  },
  {
    "id": "r110-157",
    "year": 110,
    "question_number": 157,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "問 156−157      ₆₃ 歳男性。慢性心不全と診断され、治療中である。その他の既往歴及び常\n用薬はない。\n問 157（病態・薬物治療）\n服薬は正しく継続され、副作用もみられなかったが、 ₁ ケ月前から労作時の息切\nれが徐々に増悪するようになった。 ₂ ～ ₃ 日前からは安静時にも息苦しさを自覚す\nるようになり、昨夜突然、強い咳を伴った呼吸困難が出現したため救急搬送され\nた。下肢に浮腫が認められ、血圧は ₈₈/₆₀ mmHg であった。心臓超音波検査を\n行ったところ、左室駆出率（LVEF）は ₃₀％に低下していた。さらに、胸部 X 線\n検査により肺うっ血と軽度な心拡大の所見が認められ、慢性心不全の急性増悪と診\n断され入院となった。この患者の来院時の病態及び症状に関する記述として、正し\nいのはどれか。2つ選べ。\n1    右心機能は正常である。\n2    心臓からのナトリウム利尿ペプチドの分泌が亢進している。\n3    心電図で ST 上昇が認められる。\n4    呼吸症状は、起坐位よりも仰臥位で増悪する。\n5    尿量は増加している可能性が高い。\n一般問題（薬学理論問題）【薬理】",
    "choices": [
      {
        "key": 1,
        "text": "右心機能は正常である。"
      },
      {
        "key": 2,
        "text": "心臓からのナトリウム利尿ペプチドの分泌が亢進している。"
      },
      {
        "key": 3,
        "text": "心電図で ST 上昇が認められる。"
      },
      {
        "key": 4,
        "text": "呼吸症状は、起坐位よりも仰臥位で増悪する。"
      },
      {
        "key": 5,
        "text": "尿量は増加している可能性が高い。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q157.png"
  },
  {
    "id": "r110-158",
    "year": 110,
    "question_number": 158,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "高血圧症治療薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "テラゾシンは、アドレナリンα1及びβ1受容体を遮断して、反射性頻脈を起こさずに血圧を低下させる。"
      },
      {
        "key": 2,
        "text": "アムロジピンは、電位依存性L型Ca 2＋チャネルを遮断して、血管平滑筋細胞へのCa 2＋流入を抑制する。"
      },
      {
        "key": 3,
        "text": "アリスキレンは、エンドセリンETA及びETB受容体を遮断して、血管平滑筋を弛緩させる。"
      },
      {
        "key": 4,
        "text": "インダパミドは、遠位尿細管におけるNa＋の再吸収を阻害して、循環血流量を減少させる。"
      },
      {
        "key": 5,
        "text": "エサキセレノンは、集合管において、バソプレシンV2受容体を遮断して、水の再吸収を抑制する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\nアムロジピンは、Ca 2＋チャネル遮断薬であり、電位依存性L型Ca 2＋チャネルを遮断して、血管平滑筋細胞へのCa 2＋流入を抑制する。\n\n３　誤\n\nアリスキレンは、直接レニン阻害薬であり、レニンを直接阻害して、レニン−アンジオテンシン系を抑制することにより降圧作用を示す。\n\n４　正\n\nインダパミドは、遠位尿細管前半部のNa＋−Cl－共輸送系を抑制し、Na＋、H2Oの再吸収を抑制することで循環血流量を減少させる。\n\n５　誤\n\nエサキセレノンは、ミネラルコルチコイド受容体（MR）へのアルドステロンの結合を選択的に阻害し、MRの活性を阻害することで降圧作用を示す。",
    "tags": []
  },
  {
    "id": "r110-159",
    "year": 110,
    "question_number": 159,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "抗血小板薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "シロスタゾールは、ADP P2Y12受容体を遮断することで、血小板内サイクリックAMP（cAMP）濃度を増加させる。"
      },
      {
        "key": 2,
        "text": "オザグレルは、アデノシンA2受容体を遮断することで、血小板内Ca2＋濃度の上昇を抑制する。"
      },
      {
        "key": 3,
        "text": "ベラプロストは、プロスタノイド IP 受容体を刺激することで、血小板内cAMP濃度を増加させる。"
      },
      {
        "key": 4,
        "text": "サルポグレラートは、セロトニン5-HT2受容体を遮断することで、血小板内Ca2＋濃度の上昇を抑制する。"
      },
      {
        "key": 5,
        "text": "プラスグレルは、ホスホジエステラーゼ III（PDE III）を阻害することで、血小板内cAMP濃度を増加させる。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\nオザグレルは、血小板のトロンボキサン（TX）合成酵素を阻害し、TXA2の生合成を抑制するとともに血管壁のPGI2生成促進することで血小板凝集を抑制する。\n\n３　正\n\nベラプロストは、プロスタノイド IP 受容体を刺激することで、血小板内cAMP濃度を増加させ血小板凝集を抑制する。\n\n４　正\n\nサルポグレラートは、5-HT2受容体遮断作用し、血小板内Ca2＋濃度の上昇を抑制することで血小板凝集抑制作用を示す。\n\n５　誤\n\nプラスグレルは、ADP受容体のサブタイプであるP2Y12を特異的に阻害し、cAMP濃度を増加させることにより血小板の活性化を抑制する。",
    "tags": []
  },
  {
    "id": "r110-160",
    "year": 110,
    "question_number": 160,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "呼吸器系に作用する薬物に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "オキシメテバノールは、オピオイド受容体を刺激して、鎮咳作用を示す。"
      },
      {
        "key": 2,
        "text": "L−カルボシステインは、構造中に SH 基を有し、ムコタンパク質のペプチド鎖の連結を切断して、去痰作用を示す。"
      },
      {
        "key": 3,
        "text": "フルマゼニルは、末梢性化学受容器を刺激して、間接的に呼吸中枢を興奮させる。"
      },
      {
        "key": 4,
        "text": "ブロムヘキシンは、アンブロキシールの活性代謝物であり、肺サーファクタント分泌を促進する。"
      },
      {
        "key": 5,
        "text": "ニンテダニブは、血管内皮増殖因子受容体（VEGFR）、線維芽細胞増殖因子受容体（FGFR）及び血小板由来増殖因子受容体（PDGFR）のチロシンキナーゼを阻害して、肺の線維化を抑制する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nL−カルボシステインは、シアル酸／フコース比を正常化することで、気道分泌物の粘性を正常な状態に近づける。\n\n３　誤\n\nフルマゼニルは、ベンゾジアゼピン受容体拮抗薬であり、ベンゾジアゼピン系薬により誘発される呼吸抑制を改善する。\n\n４　誤\n\nブロムヘキシンは、アンブロキソールの活性代謝物ではない。なお、アンブロキソールは、ブロムへキシンの活性代謝物であり、肺サーファクタント分泌を促進する。\n\n５　正\n\nニンテダニブは、血管内皮増殖因子受容体（VEGFR）、線維芽細胞増殖因子受容体（FGFR）及び血小板由来増殖因子受容体（PDGFR）のチロシンキナーゼを阻害し、肺の線維化を抑制するため、特発性肺線維症、間質性肺疾患に用いられる。",
    "tags": []
  },
  {
    "id": "r110-161",
    "year": 110,
    "question_number": 161,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "過敏性腸症候群治療薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ポリカルボフィルカルシウムは、胃内の酸性条件下でカルシウムを脱離し、腸管腔内において膨潤・ゲル化することで、水分バランスを調節する。"
      },
      {
        "key": 2,
        "text": "ラモセトロンは、求心性神経終末に存在するセロトニン 5-HT3受容体を遮断することで、大腸痛覚の伝達を抑制する。"
      },
      {
        "key": 3,
        "text": "メペンゾラートは、副交感神経のセロトニン 5-HT4受容体を刺激し、アセチルコリン遊離を促進することで、腸運動を亢進する。"
      },
      {
        "key": 4,
        "text": "トリメブチンは、消化管運動亢進時には、アドレナリン作動性神経のオピオイド μ 受容体を刺激することで、腸運動を抑制する。"
      },
      {
        "key": 5,
        "text": "リナクロチドは、胆汁酸トランスポーターを阻害し、胆汁酸の再吸収を抑制することで、腸管内に水分及び電解質を分泌させる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　正\n\nラモセトロンは、5-HT3受容体を遮断することにより、排便亢進や下痢を抑制するとともに大腸痛覚の過敏を抑制する。\n\n３　誤\n\nメペンゾラートは、抗コリン薬作用であり、アセチルコリンの機能を抑制することで腸管運動を抑制する。\n\n４　誤\n\nトリメブチンは、消化管運動亢進時には、副交感神経終末にあるオピオイド μ 受容体を刺激することで、腸運動を抑制する。なお、本剤は、消化管運動低下時には、交感神経終末にあるオピオイドμ受容体を刺激することで、腸運動を促進する。\n\n５　誤\n\nリナクロチドは、グアニル酸シクラーゼC受容体を活性化し、細胞内のサイクリックGMP濃度を増加させ、腸管分泌並びに腸管輸送能を促進する。",
    "tags": []
  },
  {
    "id": "r110-162",
    "year": 110,
    "question_number": 162,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "50歳男性。営業職で飲酒の機会が多く、5年間で体重は8kg増加した。健診にて4年前より高血糖を指摘されていたが、放置していた。最近、口渇と頻尿を認めるようになったため病院を受診し検査を受けた結果、2型糖尿病と診断された。服薬歴なし。喫煙20本/日。運動習慣はない。\n問162（病態・薬物治療）\n\nこの患者の身体所見及び検査値は以下のとおりである。\n\n身長175cm、体重80kg、血圧146／94mmHg、脈拍62拍／分、下肢に浮腫はない。\n本患者において2型糖尿病に合併しているのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "糖尿病性腎症"
      },
      {
        "key": 2,
        "text": "単純網膜症"
      },
      {
        "key": 3,
        "text": "病型分類Ⅰ型の脂質異常症"
      },
      {
        "key": 4,
        "text": "高尿酸血症"
      },
      {
        "key": 5,
        "text": "肥満症"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n本症例では、眼底検査で「異常なし」となっているため、単純網膜症を合併している可能性は低い。\n\n３　誤\n\n本症例では、LDL-C（基準値：140mg/dL未満）及びTG（基準値：150mg/dL未満）が高値を示している。病型分類Ⅰ型脂質異常症では、コレステロール値は変化せず、トリグリセリドが増加するため、病型分類Ⅰ型脂質異常症を合併している可能性は低い。\n\n４　誤\n\n本症例では、尿酸値（基準値：7mg/dL未満）が低値を示しているため、高尿酸血症を合併している可能性は低い。\n\n５　正\n\n本症例では、BMI：体重（kg）÷身長（m）2が約26であり、25以上であることから肥満に該当する。また、空腹時の血糖、LDL-C、TGが高い。肥満症とは、肥満によって健康障害を引き起こしているまたはそのリスクが高い状態であることから、本患者は肥満症である。",
    "tags": []
  },
  {
    "id": "r110-163",
    "year": 110,
    "question_number": 163,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "問 162−163 ₅₀ 歳男性。営業職で飲酒の機会が多く、 ₅ 年間で体重は ₈ kg 増加した。\n健診にて ₄ 年前より高血糖を指摘されていたが、放置していた。最近、口渇と頻尿\nを認めるようになったため病院を受診し検査を受けた結果、 ₂ 型糖尿病と診断され\nた。服薬歴なし。喫煙 ₂₀ 本/日。運動習慣はない。\n問 163（薬理）\n糖尿病治療薬に関する記述として、正しいのはどれか。2つ選べ。\n1     グリクラジドは、ATP 感受性 K チャネルを開口して、膵臓ランゲルハンス島\n+\nb 細胞からのインスリン分泌を促進する。\n2     ピオグリタゾンは、ペルオキシソーム増殖剤応答性受容体 a（PPAR a）を刺\n激して、アディポネクチンの分泌を低下させる。\n3     ボグリボースは、小腸上皮細胞に存在する a︲グルコシダーゼを阻害して、単\n糖類の生成を抑制する。\n4 ルセオグリフロジンは、ナトリウム︲グルコース共輸送体 ₂ （SGLT₂）を阻害\nして、近位尿細管におけるグルコースの再吸収を抑制する。\n5     イメグリミンは、インクレチンの分解を抑制して、膵臓ランゲルハンス島 a 細\n胞からのグルカゴン分泌を促進する。\n一般問題（薬学理論問題）【薬理】",
    "choices": [
      {
        "key": 1,
        "text": "グリクラジドは、ATP 感受性 K チャネルを開口して、膵臓ランゲルハンス島"
      },
      {
        "key": 2,
        "text": "ピオグリタゾンは、ペルオキシソーム増殖剤応答性受容体 a（PPAR a）を刺 激して、アディポネクチンの分泌を低下させる。"
      },
      {
        "key": 3,
        "text": "ボグリボースは、小腸上皮細胞に存在する a︲グルコシダーゼを阻害して、単 糖類の生成を抑制する。"
      },
      {
        "key": 4,
        "text": "イメグリミンは、インクレチンの分解を抑制して、膵臓ランゲルハンス島 a 細 胞からのグルカゴン分泌を促進する。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q163.png"
  },
  {
    "id": "r110-164",
    "year": 110,
    "question_number": 164,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "脂質異常症治療薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "アトルバスタチンは、3-ヒドロキシ-3-メチルグルタリルCoA（HMG-CoA）還元酵素を阻害して、肝細胞の低密度リポタンパク質（LDL）受容体を増加させる。"
      },
      {
        "key": 2,
        "text": "コレスチミドは、転写因子SREBP-1cの活性を抑制して、トリグリセリドの合成を抑制する。"
      },
      {
        "key": 3,
        "text": "プロブコールは、小腸コレステロールトランスポーターを阻害して、腸管からのコレステロール吸収を抑制する。"
      },
      {
        "key": 4,
        "text": "ベザフィブラートは、ミクロソームトリグリセリド輸送タンパク質（MTP）を阻害して、超低密度リポタンパク質（VLDL）の産生を抑制する。"
      },
      {
        "key": 5,
        "text": "ニコモールは、ニコチン酸受容体を刺激し、脂肪組織における脂肪分解を抑制して、肝臓への遊離脂肪酸の動員を減少させる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nコレスチミドは、腸管内で胆汁酸と結合し、コレステロールの体外へ排泄を増加させる。その結果、胆汁酸の腸肝循環を抑制し、肝臓でのコレステロールから胆汁酸への異化を促進することで肝細胞膜のLDL受容体を増加させる。\n\n３　誤\n\nプロブコールは、肝臓でコレステロールから胆汁酸への異化を促進し、血清コレステロール低下作用を示す。\n\n４　誤\n\nベザフィブラートは、核内タンパク質であるペルオキシソーム増殖因子活性化受容体α（PPARα）に結合し、血中において、リポ蛋白リパーゼ（LPL）を活性化することによりトリグリセリドの分解を促進する。\n\n５　正\n\nニコモールは、ニコチン酸受容体に結合し、脂肪細胞でのアデニル酸シクラーゼ阻害することでcAMP産生を抑制し、脂肪組織から肝臓への遊離脂肪酸供給を減少させる。",
    "tags": []
  },
  {
    "id": "r110-165",
    "year": 110,
    "question_number": 165,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "6歳男児。咽頭痛のため耳鼻咽喉科を受診した。血液検査で抗ストレプトリジンO（ASO）抗体と抗ストレプトキナーゼ（ASK）抗体の上昇が認められ、A群溶血性レンサ球菌（溶連菌）咽頭炎と診断された。\n問 165（病態・薬物治療）\n\nA群溶血性レンサ球菌（溶連菌）咽頭炎に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "空気感染が、主な感染経路である。"
      },
      {
        "key": 2,
        "text": "起因菌は、血液寒天培地上で溶血反応を示す。"
      },
      {
        "key": 3,
        "text": "特徴的な所見として、舌に白色の水疱を認めることが多い。"
      },
      {
        "key": 4,
        "text": "合併症として、急性糸球体腎炎を認めることがある。"
      },
      {
        "key": 5,
        "text": "自然治癒することはない。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\n本菌は、血液寒天培地上に溶血反応を示す（溶血環を形成する）ことで、検出される。\n\n３　誤\n\n本菌に感染すると、特徴的な所見として、38℃以上の発熱、咽頭発疹、苺状の舌が認められる。\n\n４　正\n\n本菌に感染後、免疫複合体の形成により、急性糸球体腎炎を認めることがある。\n\n５　誤\n\n本菌感染しても自然治癒することがあるが、合併症を防止するために抗菌薬による治療が推奨される。",
    "tags": []
  },
  {
    "id": "r110-166",
    "year": 110,
    "question_number": 166,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "問 165−166       ₆ 歳男児。咽頭痛のため耳鼻咽喉科を受診した。血液検査で抗ストレプト\nリジン O（ASO）抗体と抗ストレプトキナーゼ（ASK）抗体の上昇が認められ、\nA 群溶血性レンサ球菌（溶連菌）咽頭炎と診断された。\n問 166（薬理）\nレンサ球菌属に対して抗菌作用を示す薬物に関する記述として、正しいのはどれ\nか。2つ選べ。\n1 セファレキシンは、細菌のピルビン酸転移酵素を阻害して、UDP︲N ︲アセチル\nムラミン酸の合成を抑制する。\n2 エリスロマイシンは、細菌のジヒドロ葉酸還元酵素を阻害して、テトラヒドロ\n葉酸の生成を抑制する。\n3 アモキシシリンは、細菌のペニシリン結合タンパク質に共有結合して、不可逆\n的にトランスペプチダーゼ活性を阻害する。\n4     クリンダマイシンは、細菌のリボソーム ₅₀S サブユニットに結合して、ペプチ\nド転移酵素反応を阻害する。\n5     アジスロマイシンは、細菌のリボソーム ₃₀S サブユニットと結合して、アミノ\nアシル tRNA が mRNA と結合するのを阻害する。\n一般問題（薬学理論問題）【薬理】",
    "choices": [
      {
        "key": 1,
        "text": "クリンダマイシンは、細菌のリボソーム ₅₀S サブユニットに結合して、ペプチ ド転移酵素反応を阻害する。"
      },
      {
        "key": 2,
        "text": "アジスロマイシンは、細菌のリボソーム ₃₀S サブユニットと結合して、アミノ アシル tRNA が mRNA と結合するのを阻害する。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q166.png"
  },
  {
    "id": "r110-167",
    "year": 110,
    "question_number": 167,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "抗悪性腫瘍薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "オキサリプラチンは、がん細胞のDNA鎖内及び鎖間に架橋を形成して、DNAの複製及び転写を阻害する。"
      },
      {
        "key": 2,
        "text": "パクリタキセルは、微小管の重合を阻害して、紡錘系の機能を抑制する。"
      },
      {
        "key": 3,
        "text": "イリノテカンは、体内で活性代謝物に変化し、トポイソメラーゼI活性を阻害して、切断された一本鎖DNAの再結合を抑制する。"
      },
      {
        "key": 4,
        "text": "ニボルマブは、T細胞上のPD-1に結合し、PD-1とPD-L1及びPD-L2の結合を阻害して、T細胞の活性化を抑制する。"
      },
      {
        "key": 5,
        "text": "ラムシルマブは、上皮増殖因子受容体（EGFR）に結合し、EGFの作用を抑制して、腫瘍血管新生を抑制する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\nパクリタキセルは、微小管阻害薬であり、チュブリンの脱重合を阻害（チュブリンの重合を促進）し、微小管を安定化させ、紡錘糸機能を障害する。\n\n３　正\n\nイリノテカンは、トポイソメラーゼⅠ阻害薬であり、カルボキシルエステラーゼにより活性代謝物SN–38となり、トポイソメラーゼⅠを阻害し、切断された一本鎖DNAの再結合を抑制する。\n\n４　誤\n\nニボルマブは、免疫チェックポイント阻害薬であり、T細胞上のPD-1に結合し、PD-1とPD-L1及びPD-L2の結合を阻害して、T細胞の活性化を促進する。\n\n５　誤\n\nラムシルマブは、抗VEGFR抗体製剤であり、VEGFR–2に結合し、VEGF–A、VEGF−C、VEGF–DのVEGFR–2への結合を阻害し、血管新生を抑制する。",
    "tags": []
  },
  {
    "id": "r110-168",
    "year": 110,
    "question_number": 168,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "問 168        鉱質コルチコイド作用が弱く、糖質コルチコイド作用が最も強いステロイド性\n抗炎症薬はどれか。1つ選べ。\n1                              2                            3\nO                            O                            O\nH H3C        OH              H H3C         OH             H H3C        OH\nHO                OH         HO                 OH        HO                OH\nH3C       H        CH3       H3C        H        OH       H3C       H\nH                             H\nF       H                    F        H                   F       H\nO                              O                            O\n4                              5\nO                            O\nH H3C        OH              H H3C         OH\nHO                OH         HO                 OH\nH3C       H                  H3C        H\nH       H                    H        H\nO                              O\nH CH3\n一般問題（薬学理論問題）【薬剤】",
    "choices": [],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q168.png"
  },
  {
    "id": "r110-169",
    "year": 110,
    "question_number": 169,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "メトプロロールは、肝臓における代謝及び尿中への排泄の両過程により体内から消失する。全身クリアランスは1.0 L/minであり、静脈内投与後の尿中未変化体排泄率は投与量の10%である。メトプロロールを経口投与した際、肝初回通過効果により消失する割合（%）に最も近い値はどれか。1つ選べ。\n\n　ただし、メトプロロールの消化管からの吸収は100%であり、消化管における代謝はなく、肝血流量は1.5 L/minとする。",
    "choices": [
      {
        "key": 1,
        "text": "20"
      },
      {
        "key": 2,
        "text": "30"
      },
      {
        "key": 3,
        "text": "40"
      },
      {
        "key": 4,
        "text": "50"
      },
      {
        "key": 5,
        "text": "60"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-170",
    "year": 110,
    "question_number": 170,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "ある薬物は血漿と組織に分布し、その血漿中非結合形分率は 0.10、組織中非結合形分率は 0.50 である。この薬物を患者に投与したときの分布容積（L）に最も近い値はどれか。1つ選べ。\n\n　ただし、この患者の血漿容積は 3L、組織容積は 40L とする。",
    "choices": [
      {
        "key": 1,
        "text": "0.3"
      },
      {
        "key": 2,
        "text": "3"
      },
      {
        "key": 3,
        "text": "11"
      },
      {
        "key": 4,
        "text": "43"
      },
      {
        "key": 5,
        "text": "203"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-171",
    "year": 110,
    "question_number": 171,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "問 171          ある薬物のアルブミンへの結合定数は ₁₀（nmol/L） 、結合部位数は ₂ であ\n-1\nる。この薬物のアルブミン結合に関する両逆数プロットを点線で表し、また、この\n薬物のアルブミンへの結合が別の薬物の共存により競合的に阻害された場合を実線\nで表すとき、正しい図はどれか。1つ選べ。\nただし、図中の r はアルブミン ₁ 分子当たりに結合している薬物の分子数を、\n［Df］は非結合形薬物濃度を示す。\n1                                    2                                      3\n₅                                  ₅                                     ₅\n₄                                  ₄                                     ₄\n₃                                  ₃                                     ₃\n₁/r                                ₁/r                                    ₁/r\n₂                                  ₂                                     ₂\n₁                                  ₁                                     ₁\n-₁₀              ₀   ₁₀   ₂₀    ₃₀   -₁₀            ₀        ₁₀   ₂₀   ₃₀   -₁₀            ₀   ₁₀   ₂₀    ₃₀\n₁/［Df］\n（（nmol/L） ）                   ₁/［Df］\n（（nmol/L） ）                       ₁/［Df］\n（（nmol/L） ）\n-1                                      -1                                -1\n4                                    5                                      6\n₁₀                                 ₁₀                                     ₁₀\n₈                                  ₈                                      ₈\n₆                                  ₆                                      ₆\n₁/r                                ₁/r                                    ₁/r\n₄                                  ₄                                      ₄\n₂                                  ₂                                      ₂\n-₁₀              ₀   ₁₀   ₂₀    ₃₀   -₁₀            ₀        ₁₀   ₂₀   ₃₀   -₁₀            ₀   ₁₀   ₂₀    ₃₀\n₁/［Df］\n（（nmol/L） ）                   ₁/［Df］\n（（nmol/L） ）                       ₁/［Df］\n（（nmol/L） ）\n-1                                      -1                                -1",
    "choices": [
      {
        "key": 1,
        "text": "2                                      3 ₅                                  ₅                                     ₅"
      },
      {
        "key": 2,
        "text": "5                                      6 ₁₀                                 ₁₀                                     ₁₀"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q171.png"
  },
  {
    "id": "r110-172",
    "year": 110,
    "question_number": 172,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "問 172          プロドラッグとその活性代謝物の組合せとして、正しいのはどれか。2つ選べ。\nプロドラッグ                                 活性代謝物\n1       カルビドパ                                       ドパミン\n2       カペシタビン                                      フルオロウラシル\n3       アシクロビル                                      バラシクロビル\n4       カンデサルタンシレキセチル                               カンデサルタン\n5       オセルタミビル                                     ラニナミビル",
    "choices": [
      {
        "key": 1,
        "text": "カルビドパ                                       ドパミン"
      },
      {
        "key": 2,
        "text": "カペシタビン                                      フルオロウラシル"
      },
      {
        "key": 3,
        "text": "アシクロビル                                      バラシクロビル"
      },
      {
        "key": 4,
        "text": "カンデサルタンシレキセチル                               カンデサルタン"
      },
      {
        "key": 5,
        "text": "オセルタミビル                                     ラニナミビル"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-173",
    "year": 110,
    "question_number": 173,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "腎機能が低下したある患者のイヌリンクリアランスが30 mL/min/1.73 m2、クレアチニンクリアランスが50 mL/min/1.73 m2であった。この患者の腎機能に関する記述として適切なのはどれか。2つ選べ。ただし、クレアチニンは血漿タンパク質に結合せず、尿細管で再吸収されないものとする。",
    "choices": [
      {
        "key": 1,
        "text": "糸球体ろ過速度は20 mL/min/1.73 m2と推定できる。"
      },
      {
        "key": 2,
        "text": "イヌリンの尿細管での再吸収クリアランスは20 mL/min/1.73 m2と推定できる。"
      },
      {
        "key": 3,
        "text": "クレアチニンの尿細管分泌クリアランスは20 mL/min/1.73 m2と推定できる。"
      },
      {
        "key": 4,
        "text": "糸球体ろ過速度が正常なときより、イヌリンクリアランスは大きいと考えられる。"
      },
      {
        "key": 5,
        "text": "糸球体ろ過速度が正常なときより、クレアチニンクリアランスは小さいと考えられる。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-174",
    "year": 110,
    "question_number": 174,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "問 174          薬物の腎排泄過程における相互作用により血中濃度が上昇する薬物、併用薬、\n関与するトランスポーターの組合せとして、正しいのはどれか。2つ選べ。\n薬物         併用薬                   トランスポーター\nペプチドトランスポーター\n1    プロカインアミド     シメチジン\nPEPT₁\n有機アニオントランスポーター\n2    メトホルミン       リファンピシン\nOATP₁B₁\n有機アニオントランスポーター\n3    メトトレキサート     プロベネシド\nOAT₁ 、OAT₃\n4    ジゴキシン        ベラパミル            P︲糖タンパク質\n有機カチオントランスポーター\n5    シクロスポリン      シスプラチン\nOCT₂",
    "choices": [
      {
        "key": 1,
        "text": "プロカインアミド     シメチジン PEPT₁ 有機アニオントランスポーター"
      },
      {
        "key": 2,
        "text": "メトホルミン       リファンピシン OATP₁B₁ 有機アニオントランスポーター"
      },
      {
        "key": 3,
        "text": "メトトレキサート     プロベネシド OAT₁ 、OAT₃"
      },
      {
        "key": 4,
        "text": "ジゴキシン        ベラパミル            P︲糖タンパク質"
      },
      {
        "key": 5,
        "text": "シクロスポリン      シスプラチン OCT₂"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-175",
    "year": 110,
    "question_number": 175,
    "section": "理論",
    "subject": "法規・制度・倫理",
    "category": "",
    "question_text": "体内動態が線形1-コンパートメントモデルに従い、生物学的半減期が1.4時間である薬物を、3種類の剤形で同用量を経口投与したとき、下表に示す血中濃度時間曲線下面積 (AUC) と一次モーメント時間曲線下面積 (AUMC) が得られた。この結果に関する記述として、正しいのはどれか。2つ選べ。ただし、絶対的バイオアベイラビリティはいずれも100%とし、ln2＝0.693 とする。",
    "choices": [
      {
        "key": 1,
        "text": "最高血中濃度が最も大きいのは経口液剤である。"
      },
      {
        "key": 2,
        "text": "投与量を増やすと平均滞留時間は長くなる。"
      },
      {
        "key": 3,
        "text": "経口液剤を経口投与したときの平均吸収時間は約0 hである。"
      },
      {
        "key": 4,
        "text": "散剤の平均溶出時間は約0.5 hである。"
      },
      {
        "key": 5,
        "text": "錠剤の平均崩壊時間は約1.5 hである。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q175.png"
  },
  {
    "id": "r110-176",
    "year": 110,
    "question_number": 176,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "ある水不溶性の薬物粉体25.0gを50.0mLの容器に充てんした。この容器を水で満たしたとき、全体の質量（容器質量を除く）は55.0gであった。この粉体の真密度（g/mL）に最も近い値はどれか。１つ選べ。ただし、水の密度を1.00g/mLとし、添加した水は粉体の空隙をすべて満たすものとする。",
    "choices": [
      {
        "key": 1,
        "text": "0.80"
      },
      {
        "key": 2,
        "text": "1.00"
      },
      {
        "key": 3,
        "text": "1.25"
      },
      {
        "key": 4,
        "text": "1.50"
      },
      {
        "key": 5,
        "text": "1.75"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-177",
    "year": 110,
    "question_number": 177,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "テオフィリン無水物 (分子量 180) の結晶、非晶質、及び両者の混合物について、下図のA～C に示す水蒸気吸着等温線が得られた。この結果に関する記述のうち、正しいのはどれか。2つ選べ。\n\n　ただし、結晶は吸湿せず、非晶質は相対湿度80%以上ですべて水和物に転移するものとする。",
    "choices": [
      {
        "key": 1,
        "text": "A は、100%の結晶である。"
      },
      {
        "key": 2,
        "text": "B は、質量比で40%の結晶と60%の非晶質の混合物である。"
      },
      {
        "key": 3,
        "text": "C は、質量比で60%の結晶と40%の非晶質の混合物である。"
      },
      {
        "key": 4,
        "text": "テオフィリンの無水物は吸湿して二水和物となる。"
      },
      {
        "key": 5,
        "text": "相対湿度50%で保存したBは、質量比で1%の吸着水を含む。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q177.png"
  },
  {
    "id": "r110-178",
    "year": 110,
    "question_number": 178,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "図中の直線は、3種の薬物A、B、Cがそれぞれ溶解補助剤Xと可溶性複合体AX、BX、CXを形成し、溶解度が増大する様子を示している。\n以下の記述のうち、正しいのはどれか。2つ選べ。\n\nなお、いずれの場合も安定度定数Kは次式で表される。\nただし、［　］は濃度を示す。",
    "choices": [
      {
        "key": 1,
        "text": "溶解補助剤を添加しないとき、薬物の溶解度の大小関係は、A＝C＞Bである。"
      },
      {
        "key": 2,
        "text": "可溶性複合体AXと可溶性複合体BXの安定度定数は等しい。"
      },
      {
        "key": 3,
        "text": "可溶性複合体AXの安定度定数は、可溶性複合体CXの安定度定数より大きい。"
      },
      {
        "key": 4,
        "text": "可溶性複合体BXの安定度定数は、可溶性複合体CXの安定度定数より小さい。"
      },
      {
        "key": 5,
        "text": "Kの値が小さいほど、薬物とXは安定な可溶性複合体を形成する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q178.png"
  },
  {
    "id": "r110-179",
    "year": 110,
    "question_number": 179,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "薬物の溶解性を高める製剤的手法に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "微粉化により、比表面積を小さくする。"
      },
      {
        "key": 2,
        "text": "シクロデキストリンにより、ミセルを形成させる。"
      },
      {
        "key": 3,
        "text": "水と混和する有機溶媒を添加して、溶媒の極性を変化させる。"
      },
      {
        "key": 4,
        "text": "結晶性薬物の場合、非晶質化して熱力学的に安定化させる。"
      },
      {
        "key": 5,
        "text": "テオフィリンの場合、エチレンジアミンと複合体を形成させる。"
      }
    ],
    "correct_answer": 3,
    "explanation": "２　誤\n\nシクロデキストリンは、親水性外側と疎水性内側をもつ環状オリゴ糖で、疎水性薬物を内部に取り込んで包接化合物を形成することにより溶解性を高める。\n\n３　正\n\n有機溶媒（例：エタノール）を添加して溶媒の極性を変化させ、薬物の溶解性を高める方法をコソルベント法という。水に溶けにくい薬物でも、溶媒組成を変化させることで溶解性を改善することができる。\n\n４　誤\n\n非晶質は結晶に比べて分子配列が乱れており、熱力学的に不安定である。結晶性薬物を非晶質化することで溶解度や溶解速度を高めることができる。\n\n５　正\n\nテオフィリンの溶解性を向上させる方法である。テオフィリンにエチレンジアミンを添加すると、可溶性の複合体（塩や錯体）を形成することで溶解性が向上する。",
    "tags": []
  },
  {
    "id": "r110-180",
    "year": 110,
    "question_number": 180,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "問 180        分散系医薬品と製剤の種類（投与時）との組合せのうち、正しいのはどれか。\n2つ選べ。\n分散系医薬品（有効成分）         製剤の種類（投与時）\n1    ドキシル注 ₂₀ mg（ドキソルビシン塩酸塩）        リポソーム\n2    ネオーラル内用液 ₁₀％（シクロスポリン）          高分子ミセル\n3    リュープリン注射用 ₁ . ₈₈ mg（リュープロレリン酢酸塩） 多相エマルション\n4    フェジン静注 ₄₀ mg（含糖酸化鉄）            分散コロイド\n5       ₁％ディプリバン注（プロポフォール）          サスペンション",
    "choices": [
      {
        "key": 1,
        "text": "ドキシル注 ₂₀ mg（ドキソルビシン塩酸塩）        リポソーム"
      },
      {
        "key": 2,
        "text": "ネオーラル内用液 ₁₀％（シクロスポリン）          高分子ミセル"
      },
      {
        "key": 3,
        "text": "リュープリン注射用 ₁ . ₈₈ mg（リュープロレリン酢酸塩） 多相エマルション"
      },
      {
        "key": 4,
        "text": "フェジン静注 ₄₀ mg（含糖酸化鉄）            分散コロイド"
      },
      {
        "key": 5,
        "text": "₁％ディプリバン注（プロポフォール）          サスペンション"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-181",
    "year": 110,
    "question_number": 181,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "下図はロータリー打錠機による打錠工程を模式的に示したものである。工程Aはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "臼への充填"
      },
      {
        "key": 2,
        "text": "予備圧縮"
      },
      {
        "key": 3,
        "text": "重量調節"
      },
      {
        "key": 4,
        "text": "圧縮成形"
      },
      {
        "key": 5,
        "text": "錠剤放出"
      }
    ],
    "correct_answer": 3,
    "explanation": "①臼への充填\n\nホッパーから供給された原料粉末が臼に入る。\n\n②重量調節\n\n下杵の位置を微調整し、臼内の粉末量を調整する。\n\n③予備圧縮（A）\n\n上杵で軽く押し固め、粉末中の空気を抜く。\n\n→ これにより後の本圧縮での層分離やキャッピング（錠剤の割れ）を防ぐ。\n\n④圧縮成形\n\n本圧縮で所定の硬度・形状に成形。\n\n⑤錠剤放出\n\n下杵を上昇させ、成形された錠剤を臼から押し出す。スクリーパーで搬送方向に誘導し、出口へ送る。",
    "tags": [],
    "image_url": "/images/questions/110/q181.png"
  },
  {
    "id": "r110-182",
    "year": 110,
    "question_number": 182,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "粘膜に適用する製剤に関する記述のうち、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "バッカル錠は、咀嚼により、有効成分を放出する口腔用錠剤である。"
      },
      {
        "key": 2,
        "text": "点鼻粉末剤には、通例、密閉容器が用いられる。"
      },
      {
        "key": 3,
        "text": "点眼剤の非水性溶剤には、通例、植物油が用いられる。"
      },
      {
        "key": 4,
        "text": "眼軟膏剤に含まれる粒子の最大粒子径は、通例、150 µm 以下である。"
      },
      {
        "key": 5,
        "text": "坐剤の油脂性基剤として、マクロゴールが用いられる。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\n点鼻粉末剤は、鼻腔に投与する微粉状の製剤であり、吸湿や異物混入を防ぐために、通例、密閉容器が使用される。\n\n３　正\n\n点眼剤の非水性溶媒には、通例、植物油が用いられる。\n\n４　誤\n\n眼軟膏剤は、眼に直接適用する無菌製剤であり、角膜や結膜を刺激しないよう、含有粒子の最大粒子径は75µm以下とされている。\n\n５　誤\n\n坐剤の油脂性基材としては、体温付近で速やかに融解するカカオ脂やハードファット（ウイテプゾール）が用いられる。一方、マクロゴールは水溶性で融点が高く、体温では溶けにくいため、水溶性坐剤に用いられる。",
    "tags": []
  },
  {
    "id": "r110-183",
    "year": 110,
    "question_number": 183,
    "section": "理論",
    "subject": "薬剤",
    "category": "",
    "question_text": "日本薬局方一般試験法に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "製剤均一性試験法において、医薬品の有効成分含量が5 mgで、有効成分濃度が2.5%の素錠には、質量偏差試験が適用できる。"
      },
      {
        "key": 2,
        "text": "溶出試験法には、パドルオーバーディスク法、シリンダー法及び縦型拡散セル法がある。"
      },
      {
        "key": 3,
        "text": "カールフィッシャー法は、試料のオスモル濃度を凝固点降下法を用いて測定する方法である。"
      },
      {
        "key": 4,
        "text": "エンドトキシン試験法は、ライセート試薬を用いてグラム陰性菌由来のエンドトキシンを検出又は定量する試験法である。"
      },
      {
        "key": 5,
        "text": "注射剤の採取容量試験法は、表示量よりやや過剰に採取できる量が容器に充填されていることを確認する試験法である。"
      }
    ],
    "correct_answer": 4,
    "explanation": "２　誤\n\n溶出試験法には、回転バスケット法、パドル法、フロースルーセル法がある。なお、パドルオーバーディスク法、シリンダー法及び縦型拡散セル法は、皮膚に適用する製剤の放出試験法として用いられている。\n\n３　誤\n\nカールフィッシャー法は、メタノールなどの低級アルコール及びピリジンなどの有機塩基の存在で、水がヨウ素および二酸化イオウと定量的に反応することを利用して水分を測定する方法である。\n\n４　正\n\nエンドトキシン試験法は、カブトガニの血球抽出成分より調製されたライセート試薬を用いて、グラム陰性菌由来のエンドトキシンを検出又は定量する方法である。本試験法には、ゲル化法、光学的定量法（比濁法、比色法）がある。注射剤は、皮内、皮下及び筋肉内投与のみに用いるものを除き本試験法に適合する必要がある。\n\n５　正\n\n注射剤の採取容量試験法は、表示された容量を確実に採取できるよう、容器内にやや過剰に薬液が充填されているかを確認する試験法である。",
    "tags": []
  },
  {
    "id": "r110-184",
    "year": 110,
    "question_number": 184,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "アトピー性皮膚炎の病態と治療に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "乳幼児期には、体幹や四肢に乾燥や皮疹が発症したのちに頭部や顔面に拡大する。"
      },
      {
        "key": 2,
        "text": "掻痒、左右対称性の湿疹及び慢性・反復性経過を特徴とする。"
      },
      {
        "key": 3,
        "text": "血液検査では、血中IgA値が高値を示す。"
      },
      {
        "key": 4,
        "text": "外用療法の第一選択は、非ステロイド性抗炎症薬（NSAIDs）である。"
      },
      {
        "key": 5,
        "text": "タクロリムス軟膏を使用する場合は、塗布部位の灼熱感やほてり、感染症に注意する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n乳幼児期には、頭部、顔面に紅斑、表皮表層の剥離、湿潤性の丘疹が認められ、次第に体幹や四肢に拡大する。\n\n２　正\n\n前記参照\n\n３　誤\n\n前記参照\n\n４　誤\n\n外用療法の第一選択薬として、副腎皮質ステロイド性薬が用いられる。\n\n５　正\n\nタクロリムス軟膏を使用開始時には、灼熱感、掻痒などの刺激感を誘発することがあるため、事前の十分な説明を行い、使用継続への理解を促すことが重要である。",
    "tags": []
  },
  {
    "id": "r110-185",
    "year": 110,
    "question_number": 185,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "22歳女性。不安を主訴に来院。高校2年の3月頃より、大学受験のストレスを感じるようになった。その頃から友人と一緒に食事をした際に、喉が詰まった感じで物を飲み込みづらくなったが受験のストレスと思って放置した。大学入学後も、友人との外食の際に何度か同様の症状が出現し、次第に人に見られている気がして手が震えるようになり、友人と遊ぶこともできなくなった。就職が決まり、今後仕事に支障がでるのではないかと心配し、内科を受診したが身体所見や神経学的所見に異常はないため、精神科を紹介された。精神科での診察で質問に対して的確に回答し、抑うつ症状は認められなかった。自宅では普通に食事はできる。自分では気にする必要はないと理解しているが、なぜ、外食時にはこんなに緊張して食事ができなくなるかわからないという。この患者の治療薬として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "パロキセチン"
      },
      {
        "key": 2,
        "text": "炭酸リチウム"
      },
      {
        "key": 3,
        "text": "エチゾラム"
      },
      {
        "key": 4,
        "text": "ハロペリドール"
      },
      {
        "key": 5,
        "text": "オランザピン"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-186",
    "year": 110,
    "question_number": 186,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "17歳男性。14歳時、起床時に右肩がぴくついた後、意識が消失した。病院において脳波検査で異常が指摘され、てんかんと診断された。バルプロ酸ナトリウムによる治療が開始され、問題なく経過していた。今回、全般性強直間代発作が出現し、重積状態になったため救急搬送された。20分ほどけいれん発作が持続している。本患者のけいれん抑制のために最初に静脈内投与される薬物として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "メタンフェタミン"
      },
      {
        "key": 2,
        "text": "ジアゼパム"
      },
      {
        "key": 3,
        "text": "プロポフォール"
      },
      {
        "key": 4,
        "text": "ロラゼパム"
      },
      {
        "key": 5,
        "text": "フェノバルビタール"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-187",
    "year": 110,
    "question_number": 187,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "薬剤性過敏症症候群に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "重症型の呼吸器障害である。"
      },
      {
        "key": 2,
        "text": "原因医薬品として、抗てんかん薬や高尿酸血症治療薬がある。"
      },
      {
        "key": 3,
        "text": "原因医薬品の服用直後に発症することが多い。"
      },
      {
        "key": 4,
        "text": "初期症状として、発熱や紅斑がみられる。"
      },
      {
        "key": 5,
        "text": "発症時には原因薬を増量し、経過を観察する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "【原因薬剤】\n\n抗てんかん薬（カルバマゼピン、フェニトイン、フェノバルビタール、ゾニサミド）\n\n高尿酸血症治療薬（アロプリノール）\n\nサラゾスルファピリジン、メキシレチン、ミノサイクリン　など\n\n【治療】\n\n・原因薬剤の速やかな中止\n\n・副腎皮質ステロイドの全身投与\n\n・ガンシクロビルとγグロブリン製剤の併用療法（HHV-6の再活性化がみられる場合）",
    "tags": []
  },
  {
    "id": "r110-188",
    "year": 110,
    "question_number": 188,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "腫瘍マーカーに関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "腫瘍細胞のみから産生される。"
      },
      {
        "key": 2,
        "text": "治療中の経過観察に用いられる。"
      },
      {
        "key": 3,
        "text": "定量は、病変部の組織をサンプルとして行われる。"
      },
      {
        "key": 4,
        "text": "早期の前立腺がんでは、PSA（prostate specific antigen）は検出されない。"
      },
      {
        "key": 5,
        "text": "AFP (α-fetoprotein) は肝細胞がんのマーカーである。"
      }
    ],
    "correct_answer": 2,
    "explanation": "２　正\n\n腫瘍マーカーは、治療効果の判定や再発のモニタリングとして用いられる。例えば、手術や化学療法後にマーカー値が低下すれば、治療効果があると判断され、再び上昇すれば再発の可能性が示唆される。\n\n３　誤\n\n腫瘍マーカーの定量は、主に血清、血漿、尿などの体液を用いて行われる。なお、病変部の組織は、病理検査（形態学的評価）で用いられる。\n\n４　誤\n\nPSA（prostate specific antigen：前立腺特異抗原）は、早期の前立腺がんでも血液中に検出されることが多く、前立腺がんのスクリーニング、早期診断のために有用なマーカーである。\n\n５　正\n\nAFP (α-fetoprotein) は、肝細胞がんのマーカーとして用いられる。",
    "tags": []
  },
  {
    "id": "r110-189",
    "year": 110,
    "question_number": 189,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "白血球減少症の病態及び治療薬に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "初期症状として、発熱や全身倦怠感がある。"
      },
      {
        "key": 2,
        "text": "再生不良性貧血では起こらない。"
      },
      {
        "key": 3,
        "text": "原因薬として、抗甲状腺薬がある。"
      },
      {
        "key": 4,
        "text": "治療には、エリスロポエチンが使用される。"
      },
      {
        "key": 5,
        "text": "放射線照射に伴う場合には、メトトレキサート大量療法が有効である。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n白血球（特に好中球）が減少すると、免疫機能が低下し、発熱、全身倦怠感、咽頭痛などの感染症に類似した症状が出現する。\n\n２　誤\n\n再生不良性貧血では、骨髄の造血機能が低下するため、赤血球、白血球、血小板のいずれも減少する（汎血球減少症）。\n\n３　正\n\n抗甲状腺薬（チアマゾール、プロピオチオウラシル）は、副作用として無顆粒球症を起こしやすい。特に投与開始初期に起こりやすく、発熱や咽頭痛が出現したら服用を中止し、血液検査を行う必要がある。\n\n４　誤\n\nエリスロポエチンは、赤血球の産生を促進する造血因子であり、白血球を回復させるために使用されない。なお、白血球減少症の治療には、G-CSF製剤（フィルグラスチムなど）が使用される。\n\n５　誤\n\nメトトレキサートは、細胞毒性作用を有しており、骨髄抑制作用によって白血球を減少させるため、白血球減少症に使用されない。",
    "tags": []
  },
  {
    "id": "r110-190",
    "year": 110,
    "question_number": 190,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "慢性閉塞性肺疾患（COPD）に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "末梢気道病変と気腫性病変が複合的に関与して発症する。"
      },
      {
        "key": 2,
        "text": "中高年期より若年期での発症が多い。"
      },
      {
        "key": 3,
        "text": "病期分類には、対標準1秒量（％FEV1）を用いる。"
      },
      {
        "key": 4,
        "text": "気管支ぜん息を合併している場合には、副腎皮質ステロイド製剤の吸入よりも内服が推奨される。"
      },
      {
        "key": 5,
        "text": "インフルエンザワクチン接種は禁忌である。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n前記参照\n\n２　誤\n\n前記参照\n\n３　正\n\n前記参照\n\n４　誤\n\nCOPDと気管支ぜん息を合併している場合には、副腎皮質ステロイド製剤の吸入剤を使用するのが基本である。\n\n５　誤\n\nCOPD患者では、インフルエンザや肺炎球菌感染による急性憎悪を防ぐために、ワクチン接種が強く推奨される。",
    "tags": []
  },
  {
    "id": "r110-191",
    "year": 110,
    "question_number": 191,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "食道静脈瘤に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "肝硬変患者に好発する。"
      },
      {
        "key": 2,
        "text": "硝酸薬が危険因子である。"
      },
      {
        "key": 3,
        "text": "門脈圧の上昇がみられる。"
      },
      {
        "key": 4,
        "text": "典型的な症状に呑酸がある。"
      },
      {
        "key": 5,
        "text": "出血がなければ経過観察する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n肝硬変では、肝臓の線維化が進行することで血流抵抗が増し、門脈圧が上昇する。その結果、門脈系の血液は側副路を通じて体循環に迂回し、食道静脈叢が拡張して静脈瘤が形成される。したがって、肝硬変患者では高頻度に食道静脈瘤が合併する。\n\n２　誤\n\n硝酸薬は、血管拡張作用があり、門脈圧を低下させるため、食道静脈瘤の危険因子ではない。\n\n３　正\n\n食道静脈瘤の形成には門脈圧の上昇が不可欠であり、門脈圧亢進症に対する代償性の側副血行路形成によって発症する。\n\n４　誤\n\n食道静脈瘤の多くは無症状であり、破裂による突然の吐血で発見されることが多い。呑酸は胃食道逆流症（GERD）の典型的症状であり、本疾患とは関係がない。\n\n５　誤\n\n食道静脈瘤は、破裂した場合に高い致死率を示すため、出血の有無にかかわらず、瘤の形状・大きさなどに応じて予防的治療を行うことが推奨される。",
    "tags": []
  },
  {
    "id": "r110-192",
    "year": 110,
    "question_number": 192,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "問 192          生薬とその主な副作用の組合せのうち、正しいのはどれか。2つ選べ。\n生薬    主な副作用\n1    カンゾウ      高カリウム血症\n2    ダイオウ      下痢\n3    オウゴン      腸間膜静脈硬化症\n4    サンシシ      胆汁うっ滞\n5    マオウ       動悸",
    "choices": [
      {
        "key": 1,
        "text": "カンゾウ      高カリウム血症"
      },
      {
        "key": 2,
        "text": "ダイオウ      下痢"
      },
      {
        "key": 3,
        "text": "オウゴン      腸間膜静脈硬化症"
      },
      {
        "key": 4,
        "text": "サンシシ      胆汁うっ滞"
      },
      {
        "key": 5,
        "text": "マオウ       動悸"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-193",
    "year": 110,
    "question_number": 193,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "症例対照研究の特徴として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "まれな疾患の研究には適していない。"
      },
      {
        "key": 2,
        "text": "バイアスが生じやすい。"
      },
      {
        "key": 3,
        "text": "多数のアウトカムを扱うことができる。"
      },
      {
        "key": 4,
        "text": "後ろ向き研究である。"
      },
      {
        "key": 5,
        "text": "大きなサンプルサイズが必要である。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n症例対照研究は、すでに発症している症例群を起点とするため、まれな疾患でも効率的に対象集団を形成することが可能である。\n\n２　正\n\n本研究は後ろ向きに過去の曝露歴を調査する設計であるため、情報バイアスや選択バイアスが生じやすい。\n\n３　誤\n\n症例対照研究は、特定の疾患（アウトカム）の有無を基点として原因を遡る研究であるため、多数のアウトカムを一度に扱うことは原則として困難である。多数のアウトカムを扱う設計にはコホート研究が適している。\n\n４　正\n\n症例対照研究は、疾患発症後に曝露歴を遡って調査する後ろ向き研究に分類される。\n\n５　誤\n\nコホート研究や無作為化比較試験（RCT）に比べると、症例対照研究は比較的小規模なサンプルサイズでも実施可能であり、研究コストや時間も抑えられる。",
    "tags": []
  },
  {
    "id": "r110-194",
    "year": 110,
    "question_number": 194,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "疾患Xの有無を調べる検査Aの感度は95%、特異度は90%である。疾患Xの有病率が10%の集団に対し検査Aを実施した場合、検査Aの結果が陽性の患者のうち、真に疾患Xに罹患している確率（陽性的中率）に最も近い値はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "10%"
      },
      {
        "key": 2,
        "text": "30%"
      },
      {
        "key": 3,
        "text": "50%"
      },
      {
        "key": 4,
        "text": "70%"
      },
      {
        "key": 5,
        "text": "90%"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-195",
    "year": 110,
    "question_number": 195,
    "section": "理論",
    "subject": "病態・薬物治療",
    "category": "",
    "question_text": "薬物動態の変化に関連する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "心不全患者では、水溶性薬物の腎排泄速度が低下する。"
      },
      {
        "key": 2,
        "text": "肥満患者では、脂溶性薬物の分布容積が小さくなる。"
      },
      {
        "key": 3,
        "text": "小児では、水溶性薬物の体重当たりの分布容積が成人よりも大きい。"
      },
      {
        "key": 4,
        "text": "妊娠に伴って、糸球体ろ過速度が低下する。"
      },
      {
        "key": 5,
        "text": "血清アルブミン値低下患者では、薬物の分布容積が低下する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "２　誤\n\n脂溶性薬物は脂肪組織に分布しやすく、体脂肪が多い肥満患者では分布容積（Vd）はむしろ増加する。\n\n３　正\n\n乳児・小児では体内水分比率（体液量）が成人よりも大きいため、水溶性薬物はより広く分布し、体重あたりの分布容積が大きくなる。\n\n４　誤\n\n妊娠中は循環血液量および腎血流量が増加し、GFR（糸球体ろ過速度）は上昇する。その結果、腎排泄性薬物のクリアランスが増加することがある。\n\n５　誤\n\nアルブミンと結合する薬物は、アルブミン濃度の低下により遊離型薬物の割合が増加し、薬物が組織へ移行しやすくなり、分布容積は増大する。",
    "tags": []
  },
  {
    "id": "r110-196",
    "year": 110,
    "question_number": 196,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "70歳男性。陳旧性心筋梗塞、胆管結石の往歴があり、交通外傷で緊急搬送され、入院となった。\n\n　入院直後に、心室細動、心肺停止となり院内急変対応チームが対応し、心肺蘇生を行ったところ心拍は再開した。その時、バイタルサインは体温34.5℃、血圧86/50 mmHg、心拍113拍/分、呼吸数27回/分で、超音波検査等を実施し、外傷による出血性ショックの診断となった。気管挿管後人工呼吸器管理とし、緊急輸血を行い、生理食塩液とアドレナリン注1mgを投与した。\n\n生理食塩液の持続投与下で動脈血液ガス等を確認した結果、医師は8.4w/v%炭酸水素ナトリウム（NaHCO₃）注射液の点滴を開始した。点滴開始から90分後に状態の改善を認めた。8.4w/v% NaHCO₃注射液点滴開始前と点滴開始から90分後の動脈血液ガス等は以下のとおりであった。\n問196（物理・化学・生物）\n\n血液中HCO3－について、NaHCO3注射液の点滴開始前の物質量と開始90分後の物質量の差は8.4 w/v% NaHCO3注射液何mLに相当するか。1つ選べ。ただし、この患者の血液の体積を5.0Lとし、点滴による変化や代謝等は考慮しないものとする。また、NaHCO3の式量を84とする。",
    "choices": [
      {
        "key": 1,
        "text": "24mL"
      },
      {
        "key": 2,
        "text": "48mL"
      },
      {
        "key": 3,
        "text": "63mL"
      },
      {
        "key": 4,
        "text": "87mL"
      },
      {
        "key": 5,
        "text": "102mL"
      }
    ],
    "correct_answer": 4,
    "explanation": "NaHCO₃（炭酸水素ナトリウム）注射液の投与により、血中HCO₃⁻濃度が変化している。この濃度差が示す物質量の変化に相当するNaHCO₃注射液の投与量（mL）を求める。\n\n【Step 1】血中HCO₃⁻濃度（mEq/L）の差を求める。\n\n点滴開始前の血中HCO₃⁻濃度は10.1 mEq/L、点滴90分後は27.4 mEq/Lであることから、その差は 27.4－10.1＝17.3 mEq/L。これは、1Lの血液あたり17.3 mmolのHCO₃⁻が増えたことを意味する。\n\n【Step 2】血液中の増加したNaHCO₃の物質量を求める。\n\nこの患者の血液量は5.0 Lと仮定されているため、17.3 mmol/L × 5.0 L = 86.5 mmol のNaHCO₃が体内に増加したことになる。\n\n【Step 3】8.4 w/v％ NaHCO₃注射液のモル濃度を求める。\n\n「8.4 w/v％」とは、「100 mL中にNaHCO₃が8.4 g含まれる」ことを意味する。NaHCO₃の分子量（式量）は84であるため、8.4 g ÷ 84 g/mol = 0.1 mol → 8.4 w/v％ = ",
    "tags": []
  },
  {
    "id": "r110-197",
    "year": 110,
    "question_number": 197,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 196−197         ₇₀ 歳男性。陳旧性心筋梗塞、胆管結石の既往歴があり、交通外傷で救急搬\n送され、入院となった。\n入院直後に、心室細動、心肺停止となり院内急変対応チームが対応し、心肺蘇生\nを行ったところ心拍は再開した。その時、バイタルサインは体温 ₃₄ . ₅ ℃、血圧\n₈₆/₅₀ mmHg、心拍 ₁₁₃ 拍/分、呼吸数 ₂₇ 回/分で、超音波検査等を実施し、外傷\nによる出血性ショックの診断となった。気管挿管後人工呼吸器管理とし、緊急輸血\nを行い、生理食塩液とアドレナリン注 ₁ mg を投与した。\n生理食塩液の持続投与下で動脈血液ガス等を確認した結果、医師は ₈ . ₄ w/v％炭\n酸水素ナトリウム（NaHCO3）注射液の点滴を開始した。点滴開始から ₉₀ 分後に\n状態の改善を認めた。₈ . ₄ w/v％ NaHCO3 注射液点滴開始前と点滴開始から ₉₀ 分\n後の動脈血液ガス等は以下のとおりであった。\n（動脈血液ガス）\nNaHCO3 注射液       NaHCO3 注射液\n項目\n点滴開始前          点滴開始から ₉₀ 分後\npH                          ₆ . ₈₂            ₇ . ₃₈\nPaCO2（mmHg）                 ₆₃ . ₇            ₄₅ . ₅\nPaO2（mmHg）                  ₁₃₀ . ₀          ₁₃₁ . ₁\nHCO3 （mEq/L）                ₁₀ . ₁            ₂₇ . ₄\n-\nBase Excess（mEq/L）         -₂₃ . ₀            ₂.₃\n（その他の検査）\nNaHCO3 注射液       NaHCO3 注射液\n項目\n点滴開始前        点滴開始から ₉₀ 分後\nヘモグロビン（g/dL）                     ₉.₀            ₉.₀\n血清クレアチニン（mg/dL）                 ₁ . ₇₉         ₁ . ₄₉\neGFR（mL/min/₁ . ₇₃ m ）          ₃₀ . ₀         ₃₇ . ₀\n尿中ケトン体                          陰性             陰性\n問 197（実務）\n生理食塩液の持続投与に加え、₈ . ₄ w/v％ NaHCO3 注射液が処方された理由とし\nて最も適切なのはどれか。1つ選べ。\n1    ケトアシドーシスであったため。\n2    呼吸性アシドーシスであったため。\n3    代謝性アシドーシスであったため。\n4    PaO2 が高値であったため。\n5    ヘモグロビンが低値であったため。",
    "choices": [
      {
        "key": 1,
        "text": "ケトアシドーシスであったため。"
      },
      {
        "key": 2,
        "text": "呼吸性アシドーシスであったため。"
      },
      {
        "key": 3,
        "text": "代謝性アシドーシスであったため。"
      },
      {
        "key": 4,
        "text": "PaO2 が高値であったため。"
      },
      {
        "key": 5,
        "text": "ヘモグロビンが低値であったため。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q197.png"
  },
  {
    "id": "r110-198",
    "year": 110,
    "question_number": 198,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "38歳女性。 アレルギー性鼻炎で近医を受診し、処方1による治療を受けていた。しかし、薬剤師は処方1の薬剤の供給が不安定になったとの情報を得たため、医師と他剤への変更を検討し、処方1は処方2へ変更された。なお、処方1の薬剤と処方2の薬剤は、添加剤が同じものを調剤した。\n問198（実務）\n\n変更後の処方2に関して薬剤師が患者に行う説明として、適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "処方2の薬剤は、処方1の薬剤と同じように服用してください。"
      },
      {
        "key": 2,
        "text": "処方2の薬剤は、処方1の薬剤と効果が同等です。"
      },
      {
        "key": 3,
        "text": "処方2の薬剤は、処方1の薬剤より副作用が軽くなります。"
      },
      {
        "key": 4,
        "text": "処方1の薬剤の供給が安定すれば、医師の同意がなくても処方1に戻せます。"
      },
      {
        "key": 5,
        "text": "飲合せに注意する薬が処方1の薬剤と異なりますので、今後別の薬を服用する場合は、相談してください。"
      }
    ],
    "correct_answer": 1,
    "explanation": "レボセチリジンは、セチリジンの光学異性体（R体）のみを単離した薬剤であり、セチリジンの約半量で同等の効果を示すことが薬理学的および臨床的に確認されている。\n\n１　正\n\n処方1（セチリジン10mg）と処方2（レボセチリジン5mg）は、服用方法・回数・タイミングが同一であるため、「同じように服用してください」と説明するのは適切である。\n\n２　正\n\nレボセチリジンはセチリジンのR体であり、半量で同等の薬効を持つことが科学的に証明されている。したがって、両者は効果が等価とされる。\n\n３　誤\n\n今回の変更は供給不足が理由であり、副作用軽減を目的とした変更ではない。「副作用が軽くなる」と説明するのは不適切である。\n\n４　誤\n\n処方の変更には必ず医師の判断と同意が必要であり、たとえ供給が安定しても、医師の同意なしに処方を戻すことはできない。\n\n５　誤\n\nレボセチリジンはセチリジンのR体であり、基本的な相互作用の注意点は同様である。「飲み合わせに注意する薬が異なる」と説明するのは誤解を生むため適切でない。",
    "tags": []
  },
  {
    "id": "r110-199",
    "year": 110,
    "question_number": 199,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 198−199     ₃₈ 歳女性。アレルギー性鼻炎で近医を受診し、処方 ₁ による治療を受けて\nいた。しかし、薬剤師は処方 ₁ の薬剤の供給が不安定になったとの情報を得たた\nめ、医師と他剤への変更を検討し、処方 ₁ は処方 ₂ へ変更された。なお、処方 ₁ の\n薬剤と処方 ₂ の薬剤は、添加剤が同じものを調剤した。\n（処方 ₁ ）\nセチリジン塩酸塩錠 ₁₀ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    就寝前    ₂₈ 日分\n（処方 ₂ ）\nレボセチリジン塩酸塩錠 ₅ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    就寝前    ₂₈ 日分\n問 199（物理・化学・生物）\nセチリジン塩酸塩はその R︲エナンチオマーと S︲エナンチオマーのラセミ体で、\n旋光性は示さない。一方、レボセチリジン塩酸塩は R︲エナンチオマーであり、旋\n光性を示し、比旋光度［a］\nD = +₁₀ . ₈₀ °\nである。いま、レボセチリジン塩酸塩を\n含む原末 ₁ . ₀₀ g を量り、水に溶かして全量 ₂₀₀ mL とし、層長 ₁₀₀ mm の測定管を\n用いて温度 ₂₅ ℃で旋光度 aD を測定したところ、+₀ . ₀₅₂ °であった。この原末中\nのレボセチリジン塩酸塩の含量に最も近いのはどれか。1つ選べ。ただし、原末中\nには R︲エナンチオマー以外に旋光性を示す物質は含まないものとする。\n1    ₉₂ . ₂％\n2    ₉₄ . ₁％\n3    ₉₆ . ₃％\n4    ₉₈ . ₄％\n5    ₁₀₀ . ₇％",
    "choices": [
      {
        "key": 1,
        "text": "₉₂ . ₂％"
      },
      {
        "key": 2,
        "text": "₉₄ . ₁％"
      },
      {
        "key": 3,
        "text": "₉₆ . ₃％"
      },
      {
        "key": 4,
        "text": "₉₈ . ₄％"
      },
      {
        "key": 5,
        "text": "₁₀₀ . ₇％"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q199.png"
  },
  {
    "id": "r110-200",
    "year": 110,
    "question_number": 200,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "45歳女性。慢性的に片頭痛を繰り返しており、現在、処方1及び2の薬剤を服用している。\n\n病院再診時、患者の片頭痛日誌を確認したところ、月4回以上通勤できないほどの片頭痛発作があった。医師は処方2の薬剤を変更するため、病院薬剤師に薬剤の選択について意見を求めた。\n問200（実務）\n\n　薬剤師が提案する変更後の処方薬として適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "セレコキシブ"
      },
      {
        "key": 2,
        "text": "ガルカネズマブ"
      },
      {
        "key": 3,
        "text": "エルゴタミン"
      },
      {
        "key": 4,
        "text": "ロメリジン塩酸塩"
      },
      {
        "key": 5,
        "text": "ロキソプロフェンナトリウム"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nセレコキシブは、COX-2阻害薬であり、片頭痛発作時に使用される鎮痛薬である。\n\n２　正\n\nガルカネズマブは、抗CGRPモノクローナル抗体であり、カルシトニン遺伝子関連ペプチド（CGRP）に結合することで、片頭痛の発作を抑制するため、片頭痛の発症予防薬として用いられる。\n\n３　誤\n\nエルゴタミンは、麦角アルカロイドに分類され、片頭痛発作時の血管拡張抑制による効果を期待して使用される急性期治療薬である。したがって、予防的な使用には適さず、変更後の処方薬としては不適切である。また、トリプタン製剤とエルゴタミン製剤は、共に血管収縮作用を有しており、併用禁忌とされている。\n\n４　正\n\nロメリジンは、Ca2＋チャネル遮断薬であり、脳血管平滑筋の収縮抑制により血流の安定化をもたらすため、片頭痛の発症予防薬として用いられる。\n\n５　誤\n\nロキソプロフェンナトリウムは、NSAIDsに分類され、片頭痛発作時の一時的な鎮痛目的で使用される。",
    "tags": []
  },
  {
    "id": "r110-201",
    "year": 110,
    "question_number": 201,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 200−201      ₄₅ 歳女性。慢性的に片頭痛を繰り返しており、現在、処方 ₁ 及び ₂ の薬剤\nを服用している。\n病院再診時、患者の片頭痛日誌を確認したところ、月 ₄ 回以上通勤できないほど\nの片頭痛発作があった。医師は処方 ₂ の薬剤を変更するため、病院薬剤師に薬剤の\n選択について意見を求めた。\n（処方 ₁ ）\nスマトリプタンコハク酸塩錠 ₅₀ mg    ₁回₁錠\n頭痛時   ₁₀ 回分（₁₀ 錠）\n（処方 ₂ ）\nバルプロ酸ナトリウム徐放錠 ₂₀₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回    朝夕食後     ₂₈ 日分\n問 201（物理・化学・生物）\nスマトリプタンはセロトニン（₅︲HT）受容体のアゴニストとして薬効を発揮す\nるが、受容体のサブタイプによって結合の強さが異なる。3H 標識した ₅︲HT を用\nいた結合実験により、スマトリプタンはヒト ₅︲HT 受容体のうち ₅︲HT1D 受容体と\n最も強く結合することがわかっている。スマトリプタンが結合していない ₅︲HT1D\n受容体を R、スマトリプタンの遊離形を S、スマトリプタンと ₅︲HT1D 受容体の結\n合形を RS とし、R と S は次のように ₁：₁ で反応するものとする。\nR + S          RS\nスマトリプタンの総濃度（      ）と ₅︲HT1D 受容体の総濃度（\n［S］+［RS］                ［R］+［RS］\n）\nがともに ₁₀₀ nmol/L であるとき、 ₅︲HT1D 受容体のうちスマトリプタンが結合し\nた割合が ₀ . ₈₀ とすると、この反応の解離定数 Kd に最も近いのはどれか。1つ選\nべ。\n1    ₀ . ₂₀ nmol/L\n2    ₀ . ₈₀ nmol/L\n3    ₅ . ₀ nmol/L\n4    ₈₀ nmol/L\n5    ₁₀₀ nmol/L",
    "choices": [
      {
        "key": 1,
        "text": "₀ . ₂₀ nmol/L"
      },
      {
        "key": 2,
        "text": "₀ . ₈₀ nmol/L"
      },
      {
        "key": 3,
        "text": "₅ . ₀ nmol/L"
      },
      {
        "key": 4,
        "text": "₈₀ nmol/L"
      },
      {
        "key": 5,
        "text": "₁₀₀ nmol/L"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q201.png"
  },
  {
    "id": "r110-202",
    "year": 110,
    "question_number": 202,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 202−203     ₄ 歳男児。体重 ₁₄ kg。事故で低酸素脳症となり大学病院に入院していた\nが退院し、在宅で人工呼吸器と胃瘻及び導尿による管理を行っている。脳下垂体機\n能不全に対しては ₃ ケ月に ₁ 回、大学病院の内分泌・代謝内科を外来受診すること\nになっており、初回受診時に、以下の薬剤が処方された。\n（処方 ₁ ）\nヒドロコルチゾン錠 ₁₀ mg            ₁ 回 ₀ . ₂₅ 錠（ ₁ 日 ₀ . ₇₅ 錠）\n₁日₃回      朝昼夕食前         ₉₀ 日分\n（処方 ₂ ）\nデスモプレシン酢酸塩水和物口腔内崩壊錠 ₆₀ ng\n₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回      ₁₀ 時、₂₂ 時      ₉₀ 日分\n（処方 ₃ ）\nレボチロキシンナトリウム水和物散 ₀ . ₀₁％   ₁ 回 ₀ . ₃₅ g（ ₁ 日 ₀ . ₃₅ g）\n₁日₁回      朝食前       ₉₀ 日分\n問 202（物理・化学・生物）\n処方 ₂ の薬剤は製造過程で水溶液を凍結乾燥して調製される。水の状態図中に記\nされた状態変化のうち、凍結乾燥の過程における水の状態変化を正しく表している\nのはどれか。1つ選べ。ただし、状態変化はＡからＢへ矢印の方向に起こるものと\nする。\n1                   2                     3\n圧力                 圧力                    圧力\nＡ\nＡ   Ｂ\nＡ\nＢ\nＢ\n温度                    温度                    温度\n4                   5\n圧力                 圧力\nＢ\nＢ\nＡ\nＡ\n温度                    温度",
    "choices": [],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q202.png"
  },
  {
    "id": "r110-203",
    "year": 110,
    "question_number": 203,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 202−203     ₄ 歳男児。体重 ₁₄ kg。事故で低酸素脳症となり大学病院に入院していた\nが退院し、在宅で人工呼吸器と胃瘻及び導尿による管理を行っている。脳下垂体機\n能不全に対しては ₃ ケ月に ₁ 回、大学病院の内分泌・代謝内科を外来受診すること\nになっており、初回受診時に、以下の薬剤が処方された。\n（処方 ₁ ）\nヒドロコルチゾン錠 ₁₀ mg            ₁ 回 ₀ . ₂₅ 錠（ ₁ 日 ₀ . ₇₅ 錠）\n₁日₃回      朝昼夕食前         ₉₀ 日分\n（処方 ₂ ）\nデスモプレシン酢酸塩水和物口腔内崩壊錠 ₆₀ ng\n₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回      ₁₀ 時、₂₂ 時      ₉₀ 日分\n（処方 ₃ ）\nレボチロキシンナトリウム水和物散 ₀ . ₀₁％   ₁ 回 ₀ . ₃₅ g（ ₁ 日 ₀ . ₃₅ g）\n₁日₁回      朝食前       ₉₀ 日分\n問 203（実務）\n初回受診後の患者家族に対して薬局薬剤師が行う服薬指導として正しいのはどれ\nか。2つ選べ。\n1 発熱時には処方 ₁ の薬剤を増量する必要があるので、医師の指示を受けてくだ\nさい。\n2     幼児は成人よりも体重あたりの必要水分量が多いので、 ₁ 日合計 ₂ L 以上の水\nを薬剤と共に与えてください。\n3     決められた服用時刻を遵守すれば、食事の時間はいつでもかまいません。\n4     痙れんや嘔吐は薬剤による副作用の可能性があるので、医師に連絡してください。\n5     大豆製品は処方 ₃ の薬剤の効果を強めるので、摂らせないようにしてください。",
    "choices": [
      {
        "key": 1,
        "text": "幼児は成人よりも体重あたりの必要水分量が多いので、 ₁ 日合計 ₂ L 以上の水 を薬剤と共に与えてください。"
      },
      {
        "key": 2,
        "text": "決められた服用時刻を遵守すれば、食事の時間はいつでもかまいません。"
      },
      {
        "key": 3,
        "text": "痙れんや嘔吐は薬剤による副作用の可能性があるので、医師に連絡してください。"
      },
      {
        "key": 4,
        "text": "大豆製品は処方 ₃ の薬剤の効果を強めるので、摂らせないようにしてください。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q203.png"
  },
  {
    "id": "r110-204",
    "year": 110,
    "question_number": 204,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "体育の新任教師が初めてプール水の遊離残留塩素とpHを測定することになった。学校薬剤師は測定にあたっての留意点について新任教師から連絡を受けた。\n問204（物理・化学・生物）\n\n　pH計に関する記述として正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "参照電極にはガラス電極を用いる。"
      },
      {
        "key": 2,
        "text": "指示電極の電位はネルンストの式に従う。"
      },
      {
        "key": 3,
        "text": "測定されるpHは温度の影響を受けない。"
      },
      {
        "key": 4,
        "text": "校正されたpH計の電位を基準としてプール水のpHが測定される。"
      },
      {
        "key": 5,
        "text": "参照電極の内部液には飽和塩化アンモニウム水溶液が用いられる。"
      }
    ],
    "correct_answer": 2,
    "explanation": "pH計は、指示電極（ガラス電極）と参照電極（銀–塩化銀電極）で構成されている。指示電極の内部溶液には、通常、飽和塩化カリウム溶液が用いられる。指示電極のガラス膜を挟んで、内部溶液と試料溶液との間で水素イオン（H＋）濃度に差があると、膜電位が生じる。この電位差を測定することで、試料溶液のpHを算出することができる。\n\n１　誤\n\n参照電極には、銀–塩化銀電極が用いられる。なお、ガラス電極は指示電極として用いられる。\n\n２　正\n\n指示電極の電位はネルンストの式（①式）に従って水素イオン濃度により変化する。ネルンスト式とは、電極電位のイオン濃度の関係を示す式であり、pH計の原理に基づいている。\n\n３　誤\n\n測定されるpHは温度により変化する。温度により電極電位や溶液中の水素イオン活量が変化するため、温度補正機能が必要である。\n\n４　正\n\n　pH計の測定結果には、電極の個体差や経年変化などにより微小な誤差が生じる可能性がある。そのため、pHが既知の標準液を用いて校正し、その電位差を基準として測定を行う必要がある。\n\n５　誤\n\n参照電極の内部液には飽和塩化カリウム溶液が用いられる。",
    "tags": []
  },
  {
    "id": "r110-205",
    "year": 110,
    "question_number": 205,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 204−207     体育の新任教諭が初めてプール水の遊離残留塩素と pH を測定することに\nなった。学校薬剤師は測定にあたっての留意点について新任教諭から問合せを受け\nた。\n問 205（実務）\n学校薬剤師の回答として適切なのはどれか。2つ選べ。\n1    測定時期は、遊離残留塩素と pH の両方ともプール使用後です。\n2    遊離残留塩素と pH の両方とも少なくともプール内の対角線上のほぼ等間隔の\n₃ ケ所から採水して測定してください。\n3    遊離残留塩素濃度は、塩素剤の消毒効果を表す指標です。\n4    入泳者が持ち込んだ汚れや毛髪が原因で遊離残留塩素濃度が高くなります。\n5    pH の値によらず塩素剤の消毒効果は変わりません。",
    "choices": [
      {
        "key": 1,
        "text": "測定時期は、遊離残留塩素と pH の両方ともプール使用後です。"
      },
      {
        "key": 2,
        "text": "遊離残留塩素と pH の両方とも少なくともプール内の対角線上のほぼ等間隔の ₃ ケ所から採水して測定してください。"
      },
      {
        "key": 3,
        "text": "遊離残留塩素濃度は、塩素剤の消毒効果を表す指標です。"
      },
      {
        "key": 4,
        "text": "入泳者が持ち込んだ汚れや毛髪が原因で遊離残留塩素濃度が高くなります。"
      },
      {
        "key": 5,
        "text": "pH の値によらず塩素剤の消毒効果は変わりません。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q205.png"
  },
  {
    "id": "r110-206",
    "year": 110,
    "question_number": 206,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 204−207     体育の新任教諭が初めてプール水の遊離残留塩素と pH を測定することに\nなった。学校薬剤師は測定にあたっての留意点について新任教諭から問合せを受け\nた。\n問 206（衛生）\nその後、同教諭が遊離残留塩素を測定したところ、基準値を下回っていたため、\n消毒剤を追加することとなった。屋内プールの水質管理を担当していた別の教諭が、\n水処理に使用される消毒剤Ａと凝集剤Ｂを誤って混合したため、ガスＣが発生した。\n消毒剤Ａ、凝集剤Ｂ及びガスＣの組合せのうち、該当するのはどれか。1つ選べ。\n消毒剤Ａ             凝集剤Ｂ      ガスＣ\n1    次亜塩素酸ナトリウム    重炭酸ナトリウム      ホルムアルデヒド\n2    次亜塩素酸ナトリウム   チオ硫酸ナトリウム        塩化水素\n3    次亜塩素酸ナトリウム   ポリ塩化アルミニウム        塩素\n4    塩素化イソシアヌル酸    重炭酸ナトリウム       二酸化炭素\n5    塩素化イソシアヌル酸   チオ硫酸ナトリウム        硫化水素\n6    塩素化イソシアヌル酸   ポリ塩化アルミニウム      クロロホルム",
    "choices": [
      {
        "key": 1,
        "text": "次亜塩素酸ナトリウム    重炭酸ナトリウム      ホルムアルデヒド"
      },
      {
        "key": 2,
        "text": "次亜塩素酸ナトリウム   チオ硫酸ナトリウム        塩化水素"
      },
      {
        "key": 3,
        "text": "次亜塩素酸ナトリウム   ポリ塩化アルミニウム        塩素"
      },
      {
        "key": 4,
        "text": "塩素化イソシアヌル酸    重炭酸ナトリウム       二酸化炭素"
      },
      {
        "key": 5,
        "text": "塩素化イソシアヌル酸   チオ硫酸ナトリウム        硫化水素"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q206.png"
  },
  {
    "id": "r110-207",
    "year": 110,
    "question_number": 207,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 204−207     体育の新任教諭が初めてプール水の遊離残留塩素と pH を測定することに\nなった。学校薬剤師は測定にあたっての留意点について新任教諭から問合せを受け\nた。\n問 207（実務）\n屋内プールで刺激臭がするという連絡を受けて駆けつけた学校薬剤師が、検知管\nと真空方式ガス採取器を用いてガスＣの濃度を測定することになった。ガスＣの測\n定に用いられる検知管の取扱い及び測定方法に関する記述として、正しいのはどれ\nか。2つ選べ。\n検知管                  ppm\n真空方式ガス採取器\n1       冷蔵庫で保存した検知管は、取り出したら直ちに使用することができる。\n2 両端を折り取ったのちに使用しなかった検知管は、アルミホイルに包んで冷蔵\n庫で保存することができる。\n3       検知管の変色層の先端面が斜めの場合には、中間点を濃度として読み取る。\n4       真空方式ガス採取器は、漏れがないことを確認したのちに、試料の採取に用いる。\n5       真空方式ガス採取器で採取した空気を検知管に通す。",
    "choices": [
      {
        "key": 1,
        "text": "冷蔵庫で保存した検知管は、取り出したら直ちに使用することができる。"
      },
      {
        "key": 2,
        "text": "検知管の変色層の先端面が斜めの場合には、中間点を濃度として読み取る。"
      },
      {
        "key": 3,
        "text": "真空方式ガス採取器は、漏れがないことを確認したのちに、試料の採取に用いる。"
      },
      {
        "key": 4,
        "text": "真空方式ガス採取器で採取した空気を検知管に通す。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q207.png"
  },
  {
    "id": "r110-208",
    "year": 110,
    "question_number": 208,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "84歳男性。息子と二人暮らし。長年、近隣のクリニックで高血圧症と頻脈、アレルギー性鼻炎のため、処方1による薬物治療を受けていた。\n1年前の受診で、もの忘れが多く、その日の曜日が分からなくなることがたまにあり、付き添いの息子が処方医に相談したところ、神経内科の専門医を紹介され、そこで認知症と診断された。リバスチグミンテープ4.5mgで治療を開始し、漸増の後、現在は処方1とともに処方2の薬剤の使用を継続している。\n今回来局した息子から、「医師には言い忘れたが、最近、服薬時や飲食・飲水時に、むせの頻度が以前より高くなったので、誤嚥性肺炎になることを心配している」と相談があった。\n問208（実務）\n\n　息子の相談に対するアドバイスとして、以下のうち適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "誤嚥性肺炎の原因になるため、歯磨きは控えてください。"
      },
      {
        "key": 2,
        "text": "脱水時の水分補給には、経口補水液のゼリータイプをお勧めします。"
      },
      {
        "key": 3,
        "text": "処方1の薬剤を55℃程度のお湯に崩壊・懸濁させ、とろみをつけて服用させてください。"
      },
      {
        "key": 4,
        "text": "むせたときは、息子さんの判断で、以降は処方1の薬剤の服用を中止してください。"
      },
      {
        "key": 5,
        "text": "処方2の薬剤を内服薬のドネペジル塩酸塩錠に変更するように医師に提案できます。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n口腔ケアが不十分な状態では、口腔内に細菌が増殖し、それが唾液や食物と一緒に誤って気道に入ることで、誤嚥性肺炎のリスクが高まる。よって、毎食後の歯磨きは積極的に行うべきであり、口腔内を清潔に保つことが誤嚥性肺炎を予防することにつながる。\n\n２　正\n\n嚥下機能が低下している方は、水やお茶のようなサラサラした液体を誤って気管に入れてしまうことが多いため、ゼリー状でまとまりやすく、喉に引っかかりにくい経口補水ゼリーなどの使用が推奨される。\n\n３　正\n\n食事の温度を約55℃程度に温め、柔らかくしてとろみを加えることで、嚥下しやすい形状に調整することが可能である。これは誤嚥を防ぐための重要な工夫であり、服薬の際にもオブラートや薬用ゼリーなどを使って飲み込みやすくする方法が有効である。\n\n４　誤\n\n薬の服用を自己判断で中止することは推奨されない。服薬が困難な場合、医師または薬剤師に相談し、剤形変更（ゼリー剤・液剤への変更など）などを検討する必要がある。\n\n５　誤\n\n本患者は、嚥下機能が低下していることから、テープ剤を内服剤へ変更することは推奨されない。",
    "tags": []
  },
  {
    "id": "r110-209",
    "year": 110,
    "question_number": 209,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 208−209       ₈₄ 歳男性。息子と二人暮らし。長年、近隣のクリニックで高血圧症と頻\n脈、アレルギー性鼻炎のため、処方 ₁ による薬物治療を受けていた。\n（処方 ₁ ）\nビソプロロールフマル酸塩錠 ₅ mg      ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nエバスチン錠 ₁₀ mg            ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₂₈ 日分\n₁ 年前の受診で、もの忘れが多く、その日の曜日が分からなくなることがたまに\nあり、付き添いの息子が処方医に相談したところ、神経内科の専門医を紹介され、\nそこで認知症と診断された。リバスチグミンテープ ₄ . ₅ mg で治療を開始し、漸増\nの後、現在は処方 ₁ とともに処方 ₂ の薬剤の使用を継続している。\n（処方 ₂ ）\nリバスチグミンテープ ₁₈ mg        ₁ 回 ₁ 枚（ ₁ 日 ₁ 枚）\n₁日₁回    朝   ₂₈ 日分\n胸部、上腕部、背部のいずれかに貼付\n（全 ₂₈ 枚）\n今回来局した息子から、「医師には言い忘れたが、最近、服薬時や飲食・飲水時\nに、むせの頻度が以前より高くなったので、誤嚥性肺炎になることを心配してい\nる」との相談があった。\n問 209（物理・化学・生物）\n処方 ₂ に含まれる薬物は、下図のように、アセチルコリンエステラーゼの活性中\n心のセリン残基と反応し、共有結合中間体を形成する。\nCH3\nH3C\n処方 ₂ に含まれる薬物                                    N\nH                                       CH3\nO\nH3C       N         O\nOH\nCH3\nSer                                                          共有結合中間体\nアセチルコリンエステラーゼの\n活性中心\n共有結合中間体の構造として、正しいのはどれか。1つ選べ。\nCH3\nH3C\nN\nCH3                                     H          CH3\nH3C\nN\nCH3                              H               CH3\nO        N                                                                        O         O\nCH3\nO                                    O                                            O\nSer                                  Ser                                       Ser\n1                                    2                                            3\nCH3                                               CH3\nH3C                                           H3C\nN                                                 N\nH             CH3                             H              CH3\nO                                            O\nN        O                       H3C         N         O\nO     CH3                                          CH3                 O\nSer                                                                      Ser\n4                                                                     5",
    "choices": [],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q209.png"
  },
  {
    "id": "r110-210",
    "year": 110,
    "question_number": 210,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 210−211       ₈₆ 歳女性。高血圧症と ₂ 型糖尿病。フレイルによる通院困難のため、多職\n種の訪問による自宅でのケアと処方 ₁ による薬物治療を受けていた。訪問医から病\n院の循環器科での検査入院を勧められ、心房細動の診断を受け、ワルファリンカリ\nウムによる治療が開始された。退院後、娘が以下の処方箋を持って薬局を訪れた。\n（処方 ₁ ）\nオルメサルタン口腔内崩壊錠 ₂₀ mg     ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nシタグリプチンリン酸塩水和物錠 ₅₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回      朝食後      ₇ 日分\n（処方 ₂ ）\nワルファリンカリウム錠 ₁ mg        ₁ 回 ₁ . ₅ 錠（ ₁ 日 ₁ . ₅ 錠）\n₁日₁回      夕食後      ₇ 日分\n患者は独居だが、近所に住む娘が食事や服薬の管理をしており、今後の在宅療養\nに合わせて再度アドバイスして欲しいと依頼があった。\n問 210（物理・化学・生物）\n処方 ₂ に含まれる薬物は、下図のように、還元酵素Ａを阻害することで、血液凝\n固系が機能するために必須な補酵素イが化合物アから生成されるのを抑制する。\n化合物ア\n阻害\nOH                還元酵素Ａ                         処方 ₂ に含まれる薬物\nCH3\nCH3\nOH          CH3         CH3         CH3         CH3\n補酵素イ\n化合物アの構造として適切なのはどれか。1つ選べ。\nOH\nCH3\n1                                                         CH3\nOH         CH3         CH3         CH3         CH3\nCH3\n2                                                         CH3\nCH3         CH3         CH3         CH3\nOH\nCH3\n3                                                         CH3\nCH3         CH3         CH3         CH3\nO\nCH3\n4                                                         CH3\nO          CH3         CH3         CH3         CH3\nO\nCH3\n5                                                         CH3\nO          CH3         CH3         CH3         CH3",
    "choices": [
      {
        "key": 1,
        "text": "CH3"
      },
      {
        "key": 2,
        "text": "CH3"
      },
      {
        "key": 3,
        "text": "CH3"
      },
      {
        "key": 4,
        "text": "CH3"
      },
      {
        "key": 5,
        "text": "CH3"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q210.png"
  },
  {
    "id": "r110-211",
    "year": 110,
    "question_number": 211,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 210−211       ₈₆ 歳女性。高血圧症と ₂ 型糖尿病。フレイルによる通院困難のため、多職\n種の訪問による自宅でのケアと処方 ₁ による薬物治療を受けていた。訪問医から病\n院の循環器科での検査入院を勧められ、心房細動の診断を受け、ワルファリンカリ\nウムによる治療が開始された。退院後、娘が以下の処方箋を持って薬局を訪れた。\n（処方 ₁ ）\nオルメサルタン口腔内崩壊錠 ₂₀ mg     ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nシタグリプチンリン酸塩水和物錠 ₅₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回      朝食後      ₇ 日分\n（処方 ₂ ）\nワルファリンカリウム錠 ₁ mg        ₁ 回 ₁ . ₅ 錠（ ₁ 日 ₁ . ₅ 錠）\n₁日₁回      夕食後      ₇ 日分\n患者は独居だが、近所に住む娘が食事や服薬の管理をしており、今後の在宅療養\nに合わせて再度アドバイスして欲しいと依頼があった。\n問 211（実務）\n処方 ₂ の薬剤に関連したアドバイスとして、最も適切なのはどれか。1つ選べ。\n1     健康のため、青汁やクロレラなどを多めに摂取しましょう。\n2     チーズの摂取は避けてください。\n3     便の色が黒くなったらすぐに医師や薬剤師に連絡してください。\n4     骨を丈夫にすると言われるビタミン K のサプリメントを、積極的に摂取しま\nしょう。\n5     ナットウキナーゼは血栓を溶かすと言われるので、納豆を食べましょう。",
    "choices": [
      {
        "key": 1,
        "text": "健康のため、青汁やクロレラなどを多めに摂取しましょう。"
      },
      {
        "key": 2,
        "text": "チーズの摂取は避けてください。"
      },
      {
        "key": 3,
        "text": "便の色が黒くなったらすぐに医師や薬剤師に連絡してください。"
      },
      {
        "key": 4,
        "text": "骨を丈夫にすると言われるビタミン K のサプリメントを、積極的に摂取しま しょう。"
      },
      {
        "key": 5,
        "text": "ナットウキナーゼは血栓を溶かすと言われるので、納豆を食べましょう。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q211.png"
  },
  {
    "id": "r110-212",
    "year": 110,
    "question_number": 212,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 212−213      ₃₁ 歳女性。 ₁ ケ月前に粘血便、下痢が出現したため近所の消化器内科を受\n診し、大腸内視鏡検査により全大腸炎型潰瘍性大腸炎と診断された。医師との面談\nで、患者が安価な治療を望んだため、処方 ₁ による治療が開始され症状は改善し\nた。その後、病状が安定していたが、たびたびめまいや頭痛が生じたとの訴えが\nあったため、医師は処方 ₁ を処方 ₂ へ変更し、患者が処方 ₂ の処方箋を持って薬局\nを訪れた。\n（処方 ₁ ）\nサラゾスルファピリジン錠 ₅₀₀ mg     ₁ 回 ₁ 錠（ ₁ 日 ₄ 錠）\n₁日₄回    朝昼夕食後、就寝前           ₁₄ 日分\n（処方 ₂ ）\nメサラジン錠 ₅₀₀ mg（注）        ₁ 回 ₂ 錠（ ₁ 日 ₄ 錠）\n₁日₂回    朝夕食後        ₁₄ 日分\n（注）エチルセルロースでコーティングした放出調節製剤\n問 212（物理・化学・生物）\n処方 ₁ の薬物は、大腸へ到達後、下図のように、腸内細菌により代謝（還元）さ\nれて効果を示す。\nN O        O\nS\nN                                                       腸内細菌\nH\nN           CO2H                           主たる活性成分\nN                                 （還元反応）\nOH\n処方 ₁ の薬物\n全大腸炎型潰瘍性大腸炎に有効な主たる活性成分の構造はどれか。1つ選べ。\nNH O O                                         N O         O\nN O        O                            S                                                  S\nS                              N                                                N\nN                                   H                     N         CO2H             H               N\nH                                                     N                                          N        OH\nNH2\nOH                                   OH\n1                                        2                                              3\nN O       O\nS                                        H2N       CO2H\nN                    H\nH                    N            CO2H\nN                                      OH\nH\nOH\n4                                  5",
    "choices": [],
    "correct_answer": 5,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q212.png"
  },
  {
    "id": "r110-213",
    "year": 110,
    "question_number": 213,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 212−213      ₃₁ 歳女性。 ₁ ケ月前に粘血便、下痢が出現したため近所の消化器内科を受\n診し、大腸内視鏡検査により全大腸炎型潰瘍性大腸炎と診断された。医師との面談\nで、患者が安価な治療を望んだため、処方 ₁ による治療が開始され症状は改善し\nた。その後、病状が安定していたが、たびたびめまいや頭痛が生じたとの訴えが\nあったため、医師は処方 ₁ を処方 ₂ へ変更し、患者が処方 ₂ の処方箋を持って薬局\nを訪れた。\n（処方 ₁ ）\nサラゾスルファピリジン錠 ₅₀₀ mg     ₁ 回 ₁ 錠（ ₁ 日 ₄ 錠）\n₁日₄回    朝昼夕食後、就寝前           ₁₄ 日分\n（処方 ₂ ）\nメサラジン錠 ₅₀₀ mg（注）        ₁ 回 ₂ 錠（ ₁ 日 ₄ 錠）\n₁日₂回    朝夕食後        ₁₄ 日分\n（注）エチルセルロースでコーティングした放出調節製剤\n問 213（実務）\n薬剤師が、処方 ₂ の薬剤の服用及び注意事項について患者に説明する内容とし\nて、適切なのはどれか。2つ選べ。\n1 錠剤が大きくて飲みにくい場合は、粉砕し水や微温湯に懸濁して服用してもよ\nいこと。\n2     糞便中に白いものがみられる可能性があること。\n3     グレープフルーツジュースの飲用は避けること。\n4     症状が改善しても、再燃しないように服薬を継続する必要があること。\n5     処方 ₂ の薬剤の服用中は、大腸がん検査を避けること。",
    "choices": [
      {
        "key": 1,
        "text": "糞便中に白いものがみられる可能性があること。"
      },
      {
        "key": 2,
        "text": "グレープフルーツジュースの飲用は避けること。"
      },
      {
        "key": 3,
        "text": "症状が改善しても、再燃しないように服薬を継続する必要があること。"
      },
      {
        "key": 4,
        "text": "処方 ₂ の薬剤の服用中は、大腸がん検査を避けること。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q213.png"
  },
  {
    "id": "r110-214",
    "year": 110,
    "question_number": 214,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "52歳男性。身長167cm、体重56kg。 最近、右首のくぼみあたりに腫れやしこりがあり、近医を受診した。 医師の診察により、頚部リンパ節腫大を認めたため、医師は精査目的で地域医療支援病院の血液内科を紹介した。病変部位の生検の結果、ホジキンリンパ腫と診断された。3日後からABVD療法を開始する予定である。\n1コースは28日間で、4コースを実施する。\n\nなお、4コース実施後にISRT（病巣部放射線照射療法）を施行予定\n問214（実務）\n\n　病棟カンファレンスに参加する際、この治療に関して担当薬剤師が留意する情報として、適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "処方1の薬剤は過剰な塩化物イオンにより分解するため、生理食塩液との混和を避けること。"
      },
      {
        "key": 2,
        "text": "処方2の薬剤の累積投与量の増加に伴い、肺機能の低下に注意すること。"
      },
      {
        "key": 3,
        "text": "処方３の薬剤は非壊死性抗がん剤であるため、薬液が血管外へ漏出しても投与を継続すること。"
      },
      {
        "key": 4,
        "text": "処方4の薬剤は光に不安定であり、光分解によって血管痛の原因となる物質が生じるため、点滴容器及び経路全体を遮光して投与すること。"
      },
      {
        "key": 5,
        "text": "ABVD療法の催吐性リスクは軽度のため、ドンペリドンの嘔気時服用で対処すること。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-215",
    "year": 110,
    "question_number": 215,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 214−215      ₅₂ 歳男性。身長 ₁₆₇ cm、体重 ₅₆ kg。最近、右首のくぼみあたりに腫れや\nしこりがあり、近医を受診した。医師の診察により、頸部リンパ節腫大を認めたた\nめ、医師は精査目的で地域医療支援病院の血液内科を紹介した。病変部位の生検の\n結果、ホジキンリンパ腫と診断された。 ₃ 日後から ABVD 療法を開始する予定で\nある。\n（ABVD 療法）\n投与       投与\n投与量\n時間     スケジュール\n（処方 ₁ ）ドキソルビシン塩酸塩注射用          ₂₅ mg/m /day    ₃₀ 分   day ₁，₁₅\n（処方 ₂ ）ブレオマイシン塩酸塩注射用          ₁₀ mg/m /day    ₃₀ 分   day ₁，₁₅\n（処方 ₃ ）ビンブラスチン硫酸塩注射用          ₆ mg/m /day     ₁₅ 分   day ₁，₁₅\n（処方 ₄ ）ダカルバジン注射用              ₃₇₅ mg/m /day   ₆₀ 分   day ₁，₁₅\n₁ コースは ₂₈ 日間で、 ₄ コースを実施する。なお、 ₄ コース実施後に ISRT\n（病巣部放射線照射療法）を施行予定\n問 215（物理・化学・生物）\n処方 ₄ の薬物はプロドラッグであり、代謝物が DNA と共有結合を形成して抗腫\n瘍効果を示す。以下の代謝経路に示す化合物のうち、DNA 塩基による求核置換反\n応を受け、薬効を示す活性本体として、最も適切なのはどれか。1つ選べ。\nN     NH                                          N     NH\n生体内酸化\nO             N     N                             O          N   N\nNH2                  N   CH3                      NH2            N       CH3\nH 3C\nOH\n処方 ₄ の薬物                                                Ａ\nO\n+                               H         H\nH3C   N N\nＢ\nＤ\nN         NH                                N     NH\nO                NH2                          O         HN   N\nNH2                                         NH2            N       CH3\nＥ                                             Ｃ\n（Ｄの対アニオンは省略している。）\n1     Ａ\n2     Ｂ\n3     Ｃ\n4     Ｄ\n5     Ｅ",
    "choices": [],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q215.png"
  },
  {
    "id": "r110-216",
    "year": 110,
    "question_number": 216,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "保険薬局に勤務している薬剤師が、看護学校の講師を担当することになった。講義では、植物に含まれている麻薬成分が医療用麻薬として使用されていることを紹介することにした。最近、高度のがん疼痛のある患者が、その初回の服薬を躊躇した事例を経験したことから、その場合の対応や、現場での医療用麻薬の有効な使い方についても講義しようと考えている。患者が服薬を躊躇した事例の処方薬は、モルヒネ塩酸塩水和物徐放性カプセルとモルヒネ塩酸塩水和物内容液であった。\n問216（実務）\n\n講義で伝える内容として、適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "オピオイドを定期的に鎮痛に必要な量で投与すれば、がん患者の生命予後に影響を与えない。"
      },
      {
        "key": 2,
        "text": "がん痛み管理にオピオイドを使用する場合、精神依存が生じる可能性は低く、オピオイドの使用を控える理由とはならない。"
      },
      {
        "key": 3,
        "text": "服薬を躊躇したこの高度のがん疼痛のある患者に対しては、弱いオピオイドを提案する。"
      },
      {
        "key": 4,
        "text": "高度の腎機能障害がある患者に対しては、この事例の処方薬の投与を推奨する。"
      },
      {
        "key": 5,
        "text": "がん疼痛の突出痛がある場合、オピオイドの徐放製剤をレスキュー薬として投与する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-217",
    "year": 110,
    "question_number": 217,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 216−217      保険薬局に勤務している薬剤師が、看護学校の講師を担当することになっ\nた。講義では、植物に含まれている麻薬成分が医療用麻薬として使用されているこ\nとを紹介することにした。最近、高度のがん疼痛のある患者が、その初回の服薬を\n躊躇した事例を経験したことから、その場合の対応や、現場での医療用麻薬の有効\nな使い方についても講義しようと考えている。患者が服薬を躊躇した事例の処方薬\nは、モルヒネ塩酸塩水和物徐放性カプセルとモルヒネ塩酸塩水和物内用液であっ\nた。\n問 217（物理・化学・生物）\nまた、講義ではモルヒネと同じ植物に含まれる麻薬成分である化合物Ｘについて\nも紹介し、化合物Ｘは一般用医薬品の鎮咳薬としても利用され、一部ではその濫用\nが問題になっていることを述べることにした。化合物Ｘの化学構造式と、その基原\nとなる植物写真の組合せとして、正しいのはどれか。1つ選べ。\nＡ                                     Ｂ                  Ｃ\nCH2\nCH3                                       CH3\nH   N                                     H   N          H    N\nH                                         H              HO\nO             OH                                          O\nH3C    O           H     H            H3C   O                      HO        H     O\nア                                         イ\n化学構造式              写真\n1           A                  ア\n2           B                  ア\n3           C                  ア\n4           A                  イ\n5           B                  イ\n6           C                  イ",
    "choices": [
      {
        "key": 1,
        "text": "A                  ア"
      },
      {
        "key": 2,
        "text": "B                  ア"
      },
      {
        "key": 3,
        "text": "C                  ア"
      },
      {
        "key": 4,
        "text": "A                  イ"
      },
      {
        "key": 5,
        "text": "B                  イ"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q217.png"
  },
  {
    "id": "r110-218",
    "year": 110,
    "question_number": 218,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "36歳男性。昨日一食事会があり中華料理とアルコールを摂取した。昨日から胸やけと胃の痛みがあり、まだ治まらなかったので、一般用医薬品の購入を希望し来局した。薬剤師は以下の成分を含む医薬品を提案した。男性はこの薬の成分、副作用や飲み方などについての詳しい説明を求めた。\n＜提案した一般用医薬品に含まれる成分＞\n\nピレンゼピン塩酸塩水和物\n\nメタケイ酸アルミ酸マグネシウム\n\n炭酸水素ナトリウム\n\nビオヂアスターゼ2000\n問218（実務）\n\n　薬剤師の販売時の説明として、適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ピレンゼピンは、胃酸を中和することで効果を発揮する成分です。"
      },
      {
        "key": 2,
        "text": "メタケイ酸アルミン酸マグネシウムは、ピレンゼピンで起こる便秘を防止するために配合されています。"
      },
      {
        "key": 3,
        "text": "本剤には食物の消化を促進する成分が含まれています。"
      },
      {
        "key": 4,
        "text": "本剤の服用により、目のかすみ、異常なまぶしさなどの症状が現れることがあります。"
      },
      {
        "key": 5,
        "text": "2週間服用しても症状が治まらない場合は、さらに服用を継続してください。"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nピレンゼピンは、抗コリン薬であり、胃酸分泌を抑制する作用を示す。\n\n２　誤\n\nメタケイ酸アルミン酸マグネシウムは、胃酸を中和する作用を示す。\n\n３　正\n\n本剤には、食物の消化を促進するビオヂアスターゼ2000が含まれている。\n\n４　正\n\n本剤には、抗コリン薬であるピレンゼピンが含まれており、眼の調節障害を起こすことがあるため、目のかすみ、異常なまぶしさなどの症状が現れることがある。\n\n５　誤\n\n本剤を2週間服用しても症状が治らない場合は、本剤の使用を中止し、医師または薬剤師、登録販売者に相談するように指導する必要がある。",
    "tags": []
  },
  {
    "id": "r110-219",
    "year": 110,
    "question_number": 219,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 218−219      ₃₆ 歳男性。一昨日食事会があり中華料理とアルコールを摂取した。昨日か\nら胸やけと胃の痛みがあり、まだ治まらなかったので、一般用医薬品の購入を希望\nし来局した。薬剤師は以下の成分を含む医薬品を提案した。男性はこの薬の成分、\n副作用や飲み方などについての詳しい説明を求めた。\n＜提案した一般用医薬品に含まれる成分＞\nピレンゼピン塩酸塩水和物\nメタケイ酸アルミン酸マグネシウム\n炭酸水素ナトリウム\nビオヂアスターゼ ₂₀₀₀\n問 219（物理・化学・生物）\nこの患者の胸やけや胃の痛みにつながった可能性が高いのはどれか。2つ選べ。\n1     胃酸が下部食道壁を刺激している。\n2     胃腺の壁細胞からの胃酸分泌が減少している。\n3     胃粘膜表面を覆う粘液の分泌が増加している。\n4     胃内でアセチルコリンやヒスタミンの分泌量が増加している。\n5     幽門括約筋が拡張し、胃内容物の排出が促進されている。",
    "choices": [
      {
        "key": 1,
        "text": "胃酸が下部食道壁を刺激している。"
      },
      {
        "key": 2,
        "text": "胃腺の壁細胞からの胃酸分泌が減少している。"
      },
      {
        "key": 3,
        "text": "胃粘膜表面を覆う粘液の分泌が増加している。"
      },
      {
        "key": 4,
        "text": "胃内でアセチルコリンやヒスタミンの分泌量が増加している。"
      },
      {
        "key": 5,
        "text": "幽門括約筋が拡張し、胃内容物の排出が促進されている。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q219.png"
  },
  {
    "id": "r110-220",
    "year": 110,
    "question_number": 220,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "40歳女性。全身倦怠感が続いたため、近医を受診した。血液検査の結果は以下のとおりであった。\n問220（実務）\n\n　この患者の検査結果及び薬物治療について、適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "血液検査の結果から、巨赤芽球性貧血であると考えられる。"
      },
      {
        "key": 2,
        "text": "薬で便が黒くなる場合があるため、事前に情報提供しておく必要がある。"
      },
      {
        "key": 3,
        "text": "この薬の頻度の高い副作用に血栓塞栓症がある。"
      },
      {
        "key": 4,
        "text": "血清鉄量が改善されたら、この薬は速やかに服用を中止する。"
      },
      {
        "key": 5,
        "text": "薬を食後服用しているのは、悪心・嘔吐の副作用を軽減させるねらいがある。"
      }
    ],
    "correct_answer": 2,
    "explanation": "本症例では、処方されている薬が鉄剤（クエン酸第一鉄ナトリウム）であり、また、血液検査の結果（MCV：低値、MCH：低値→小球性低色素性貧血、フェリチン（貯蔵鉄）：低値、総鉄結合能（TIBC）：高値）から、「鉄欠乏性貧血」であると考えられる。\n\n１　誤\n\n前記参照\n\n２　正\n\n鉄剤を服用すると、便が黒くなることがあるため、事前に情報提供しておく必要がある。\n\n３　誤\n\n血栓塞栓症は、鉄剤の一般的な副作用ではない。なお、エリスロポエチン製剤、女性ホルモン製剤の副作用として、血栓塞栓症が起こることがある。\n\n４　誤\n\n血清鉄量が改善しても、フェリチン（貯蔵鉄）が十分回復するまで、鉄剤を継続服用する必要がある。\n\n５　正\n\n鉄剤は、副作用として胃障害（悪心・嘔吐など）を起こしやすいため、食後に服用して副作用を軽減する必要がある。",
    "tags": []
  },
  {
    "id": "r110-221",
    "year": 110,
    "question_number": 221,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 220−221       ₄₀ 歳女性。全身倦怠感が続いたため、近医を受診した。血液検査の結果は\n以下のとおりであった。\n（血液検査）\n赤血球 ₄₂₄ # ₁₀ /nL、白血球 ₄ , ₈₀₀/nL、\nHb ₉ . ₀ g/dL、Ht（ヘマトクリット）₃₂ . ₅％、\nMCV（平均赤血球容積）₇₆ . ₇ fL（基準値 ₈₀～₁₀₀ fL）、\nMCH（平均赤血球血色素量）₂₁ . ₂ pg（基準値 ₂₇～₃₄ pg）、\nMCHC（平均赤血球ヘモグロビン濃度）₂₇ . ₇％（基準値 ₃₀～₃₅％）、\nフェリチン ₄ . ₂ ng/mL（基準値 ₅ ～₁₅₇ ng/mL）、\n総鉄結合能（TIBC）₅₅₀ ng/dL（基準値 ₂₅₀～₄₆₀ ng/dL）、\n不飽和鉄結合能（UIBC）        ア    ng/dL（基準値 ₁₅₀～₃₈₅ ng/dL）\nこの検査結果を受け、医師から以下の薬が処方された。\n（処方）\nクエン酸第一鉄ナトリウム錠 ₅₀ mg          ₁ 回 ₂ 錠（ ₁ 日 ₄ 錠）\n₁日₂回    朝夕食後     ₁₄ 日分\n問 221（物理・化学・生物）\nこの患者に当てはまるのはどれか。2つ選べ。\n1        ア   の数値は、UIBC の基準値より低い。\n2     血清フェリチン値が基準値より低いことから、貯蔵鉄が不足している。\n3     血中トランスフェリン濃度は、基準値よりも低い。\n4     服用した鉄剤は、 ₃ 価の鉄イオンとして輸送体により腸管から吸収される。\n5 消化管から吸収された鉄により、まず血清鉄量が増加し、遅れて貯蔵鉄量が増\n加する。",
    "choices": [
      {
        "key": 1,
        "text": "ア   の数値は、UIBC の基準値より低い。"
      },
      {
        "key": 2,
        "text": "血清フェリチン値が基準値より低いことから、貯蔵鉄が不足している。"
      },
      {
        "key": 3,
        "text": "血中トランスフェリン濃度は、基準値よりも低い。"
      },
      {
        "key": 4,
        "text": "服用した鉄剤は、 ₃ 価の鉄イオンとして輸送体により腸管から吸収される。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q221.png"
  },
  {
    "id": "r110-222",
    "year": 110,
    "question_number": 222,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "68歳男性。 パーキンソン病及びうつ病の治療のため継続して薬剤を服用し、パーキンソン病の症状は軽快していたが、1ヶ月前より時間帯によって歩くことができたりできなかったりする症状が認められ、生活に支障をきたすようになった。薬の調節とリハビリテーションを行う目的で4週間の入院となった。\n（入院時持参薬）\n\nレボドパ100mg・カルビドパ配合錠\n\nペルゴリドメシル酸塩錠 250μg\n\nパロキセチン錠20mg\n問222（物理・化学・生物）\n\n　下図に示すように、レボドパは、末梢で酵素Aが触媒する反応によってドパミンに、カテコール-O-メチルトランスフェラーゼ（COMT）によるメチル化によって代謝物Bに変換される。以下の記述のうち、正しいのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "レボドパは、ラセミ体である。"
      },
      {
        "key": 2,
        "text": "酵素Aによる反応は、アミノ基転移反応である。"
      },
      {
        "key": 3,
        "text": "酵素Aによる反応は、ビタミンB6に由来する補酵素によって促進される。"
      },
      {
        "key": 4,
        "text": "レボドパよりもドパミンの方が、脳内へ移行しやすい。"
      },
      {
        "key": 5,
        "text": "代謝物Bは、レボドパ分子内のヒドロキシ基がメチル化されたものである。"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nラセミ体とは、光学異性体（鏡像異性体）である「L体」と「D体」が1：１の割合で含まれている等量混合物である。 レボドパは、ドパのL体であることからラセミ体ではない。\n\n２　誤\n\nレボドパをドパミンに変換する酵素は、芳香族L-アミノ酸脱炭酸酵素（酵素A）であり、脱炭酸反応に関与する。なお、芳香族L-アミノ酸脱炭酸酵素（酵素A）の補酵素として、ビタミンB6の活性体（PLP：ピリドキサールリン酸）が用いられる。\n\n３　正\n\n解説2参照。\n\n４　誤\n\nドパミンは、血液脳関門をほとんど通過しないため、レボドパよりも脳内移行性が低い。\n\n５　正\n\nCOMTは、主にレボドパのカテコール構造の3位のヒドロキシ基をメチル化するため、代謝物Bは、レボドパ分子内のヒドロキシ基（カテコール構造の3位のヒドロキシ基）がメチル化されたものである。",
    "tags": []
  },
  {
    "id": "r110-223",
    "year": 110,
    "question_number": 223,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 222−223      ₆₈ 歳男性。パーキンソン病及びうつ病の治療のため継続して薬剤を服用\nし、パーキンソン病の症状は軽快していたが、 ₁ ケ月前より時間帯によって歩くこ\nとができたりできなかったりする症状が認められ、生活に支障をきたすようになっ\nた。薬の調節とリハビリテーションを行う目的で ₄ 週間の入院となった。\n（入院時持参薬）\nレボドパ ₁₀₀ mg・カルビドパ配合錠\nペルゴリドメシル酸塩錠 ₂₅₀ ng\nパロキセチン錠 ₂₀ mg\n問 223（実務）\n入院後、レボドパ・カルビドパ配合錠を ₁ 回 ₁ 錠、 ₁ 日 ₃ 回から ₁ 回 ₁ 錠、 ₁ 日\n₅ 回に増量したが、症状が改善しなかったため、さらに薬剤を追加することとなっ\nた。この患者に追加する薬剤の候補として適切なのはどれか。2つ選べ。\n1      イストラデフィリン錠\n2      エンタカポン錠\n3      セレギリン塩酸塩錠\n4      サフィナミドメシル酸塩錠\n5      ラサギリンメシル酸塩錠",
    "choices": [
      {
        "key": 1,
        "text": "イストラデフィリン錠"
      },
      {
        "key": 2,
        "text": "エンタカポン錠"
      },
      {
        "key": 3,
        "text": "セレギリン塩酸塩錠"
      },
      {
        "key": 4,
        "text": "サフィナミドメシル酸塩錠"
      },
      {
        "key": 5,
        "text": "ラサギリンメシル酸塩錠"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q223.png"
  },
  {
    "id": "r110-224",
    "year": 110,
    "question_number": 224,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "55歳女性。身長162cm、体重51kg。腹痛と微熱が続くため総合病院内科を受診した。来院時の体温37.6℃。血液検査で炎症所見、及び左下腹部に圧痛をともなう腫瘍が認められたため精査目的で入院となり、直腸がんStageIVbと診断された。コンパニオン診断が実施され、その結果をもとにmFOLFOX6（レボホリナート、フルオロウラシル、オキサリプラチン）にセツキシマブを組合せた治療を実施する方針となった。\n問224（実務）\n\n　この化学療法を選択するにあたり、参照されたコンパニオン診断の検査項目はどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ALK融合遺伝子"
      },
      {
        "key": 2,
        "text": "EGFR遺伝子"
      },
      {
        "key": 3,
        "text": "HER2タンパク質"
      },
      {
        "key": 4,
        "text": "RAS遺伝子"
      },
      {
        "key": 5,
        "text": "UGT1A1遺伝子"
      }
    ],
    "correct_answer": 4,
    "explanation": "コンパニオン診断とは、特定の医薬品の有効性や安全性を一層高めるために、その使用対象患者に該当するかどうかなどをあらかじめ検査する目的で行われる診断のことである。本症例で用いられている薬剤（レボホリナート、フルオロウラシル、オキサリプラチン、セツキシマブ）のうち、コンパニオン診断が必要な薬剤は、セツキシマブである。セツキシマブは、抗EGFRモノクローナル抗体製剤であり、RAS遺伝子野生型に効果があるが、RAS遺伝子変異型に効果が期待できない。そのため、セツキシマブを用いる際、RAS（KRAS/NRAS）遺伝子検査を行う必要がある。",
    "tags": []
  },
  {
    "id": "r110-225",
    "year": 110,
    "question_number": 225,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 224−225    ₅₅ 歳女性。身長 ₁₆₂ cm、体重 ₅₁ kg。腹痛と微熱が続くため総合病院内科\nを受診した。来院時の体温 ₃₇ . ₆ ℃。血液検査で炎症所見、及び左下腹部に圧痛を\nともなう腫瘤が認められたため精査目的で入院となり、直腸がん Stage Ⅳb と診断\nされた。コンパニオン診断が実施され、その結果をもとに mFOLFOX₆ （レボホ\nリナート、フルオロウラシル、オキサリプラチン）にセツキシマブを組合せた治療\nを実施する方針となった。\n問 225（物理・化学・生物）\n前問で参照された検査項目で確かめられたのはどれか。1つ選べ。\n1     特定のがん遺伝子が存在すること。\n2     特定のがん抑制遺伝子に変異が存在すること。\n3     特定のがん原遺伝子      に変異が存在しないこと。\n（注）\n4     特定の薬物代謝酵素遺伝子の一塩基多型のタイプが存在すること。\n5     転座した異常染色体が存在すること。\n（注）がん原遺伝子：原がん遺伝子ともいう",
    "choices": [
      {
        "key": 1,
        "text": "特定のがん遺伝子が存在すること。"
      },
      {
        "key": 2,
        "text": "特定のがん抑制遺伝子に変異が存在すること。"
      },
      {
        "key": 3,
        "text": "特定のがん原遺伝子      に変異が存在しないこと。 （注）"
      },
      {
        "key": 4,
        "text": "特定の薬物代謝酵素遺伝子の一塩基多型のタイプが存在すること。"
      },
      {
        "key": 5,
        "text": "転座した異常染色体が存在すること。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q225.png"
  },
  {
    "id": "r110-226",
    "year": 110,
    "question_number": 226,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "34歳女性。この女性の12歳の娘に市からヒトパピローマウイルス（HPV）ワクチン接種についてのお知らせが届いた。娘はHPVワクチンの接種歴がない。この女性はHPVワクチンの説明を聞くため、市から送られた下の成分表を含む資料を持って娘と一緒にかかりつけ薬局に来局した。そのHPVワクチンの成分、投与方法、そして免疫応答を高める成分(アジュバント)が入っていることなどを、下の成分表を確認しながら薬剤師が説明した。\n問226(実務)\n\n　このワクチンに関する説明として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "これは弱毒生ワクチンです。"
      },
      {
        "key": 2,
        "text": "子宮頸がんを予防するものです。"
      },
      {
        "key": 3,
        "text": "筋肉注射で接種します。"
      },
      {
        "key": 4,
        "text": "接種は1回で完了します."
      },
      {
        "key": 5,
        "text": "HPV(16型/18型)感染後に接種しても、がんを予防する効果があります。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nHPVワクチン（以下：本剤）は、ウイルス様粒子（HPV16/18型L1タンパク質ウイルス様粒子）を用いた不活化ワクチンである。\n\n２　正\n\nHPV16/18型は、子宮頸がんの主な原因ウイルスであり、本剤は、子宮頸がんを予防するために用いられる。\n\n３　正\n\n本剤は、10歳以上の女性に、通常、1回0.5mLを0、１、6ヶ月後に3回、上腕の三角筋部に筋肉内接種する。\n\n４　誤\n\n解説３参照\n\n５　誤\n\n本剤は、接種時に感染が成立しているHPVの排除及び既に生じているHPV感染の病変の進行予防効果は期待できない。",
    "tags": []
  },
  {
    "id": "r110-227",
    "year": 110,
    "question_number": 227,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 226−227     ₃₄ 歳 女 性。 こ の 女 性 の ₁₂ 歳 の 娘 に 市 か ら ヒ ト パ ピ ロ ー マ ウ イ ル ス\n（HPV）ワクチン接種についてのお知らせが届いた。娘は HPV ワクチンの接種歴\nがない。この女性は HPV ワクチンの説明を聞くため、市から送られた下の成分表\nを含む資料を持って娘と一緒にかかりつけ薬局に来局した。その HPV ワクチンの\n成分、投与方法、そして免疫応答を高める成分（アジュバント）が入っていること\nなどを、下の成分表を確認しながら薬剤師が説明した。\nHPV ワクチンの成分表\nHPV ワクチンの成分                                              分量\n薬効成分 ヒトパピローマウイルス ₁₆ 型 L₁ タンパク質ウイルス様                     ₂₀ ng\n粒子\nヒトパピローマウイルス ₁₈ 型 L₁ タンパク質ウイルス様                 ₂₀ ng\n粒子\n添加物Ａ ₃︲脱アシル化︲₄' ︲モノホスホリルリピッド A                          ₅₀ ng\n（リポ多糖誘導体）\n添加物Ｂ 水酸化アルミニウム懸濁液（アルミニウムとして）                            ₅₀₀ ng\nその他の 塩化ナトリウム（等張化剤）、リン酸二水素ナトリウム（緩衝剤）、\n添加物      pH 調節剤\n問 227（物理・化学・生物）\nこのワクチンに含まれる添加物に関する記述として、誤っているのはどれか。\n1つ選べ。\n1     添加物Ａは、細菌由来成分の誘導体である。\n2     添加物Ａと添加物Ｂは、ともにアジュバントである。\n3     添加物Ｂは、抗原を吸着し、投与部位での抗原の滞留時間を延ばす。\n4     添加物Ａは、抗原提示細胞の抗原提示機能を促進する。\n5 添加物Ａと添加物Ｂは、ともに自然免疫応答を抑制し、獲得免疫応答を促進す\nる。",
    "choices": [
      {
        "key": 1,
        "text": "添加物Ａは、細菌由来成分の誘導体である。"
      },
      {
        "key": 2,
        "text": "添加物Ａと添加物Ｂは、ともにアジュバントである。"
      },
      {
        "key": 3,
        "text": "添加物Ｂは、抗原を吸着し、投与部位での抗原の滞留時間を延ばす。"
      },
      {
        "key": 4,
        "text": "添加物Ａは、抗原提示細胞の抗原提示機能を促進する。"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q227.png"
  },
  {
    "id": "r110-228",
    "year": 110,
    "question_number": 228,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "76歳男性。下肢にしびれを感じて外科を受診し、6ヶ月にわたって通院していたが、その間、腎機能が徐々に低下していたため内科を紹介された。血液検査結果により慢性腎臓病と診断され、外来で経過を観察することになった。\n問228(実務)\n\n　この患者の慢性腎臓病の重症度を分類する上で、必要な検査データはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "BUN"
      },
      {
        "key": 2,
        "text": "血清アルブミン"
      },
      {
        "key": 3,
        "text": "eGFR"
      },
      {
        "key": 4,
        "text": "尿アルブミン/クレアチニン比"
      },
      {
        "key": 5,
        "text": "尿タンパク/クレアチニン比"
      }
    ],
    "correct_answer": 3,
    "explanation": "【CKD（慢性腎臓病）の診断基準】\n\n慢性腎臓病（CKD）は、次のいずれか、または両方が3ヶ月以上持続することで診断される。\n\n① 腎障害の存在を示す所見\n\n・尿タンパク：0.15 g/日以上、または0.15 g/gCr以上\n\n・アルブミン尿：30 mg/日以上、または30 mg/gCr以上\n\n・尿沈渣の異常、尿細管障害による電解質異常やその他の異常\n\n・病理組織検査や画像検査による異常所見\n\n・腎移植の既往\n\n② GFR（糸球体濾過量）が60 mL/分/1.73㎡未満\n\nCKDの重症度は、「原疾患」「GFR区分」「タンパク尿区分」を組み合わせて評価する。ステージが進むほど、死亡・末期腎不全・心血管疾患のリスクは高くなる。本症例では、患者はCKDと診断されており、空腹時血糖：81 mg/dL、HbA1c：5.6％であるため、糖尿病ではないと判断できる。また、血圧：142/85 mmHgであるため、高血圧が原疾患と考えられる。\n\nなお、原疾患が高血圧である場合には、eGFRに加えて、尿タンパク定量（g/日）、尿タンパク／Cr比（g/gCr）を用いて、重症度分類を行う。",
    "tags": []
  },
  {
    "id": "r110-229",
    "year": 110,
    "question_number": 229,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 228−229      ₇₆ 歳男性。下肢にしびれを感じて外科を受診し、 ₆ ケ月にわたって通院し\nていたが、その間、腎機能が徐々に低下していたため内科を紹介された。血液検査\n結果により慢性腎臓病と診断され、外来で経過を観察することになった。\n（外来時の身体所見）\n身長 ₁₆₈ cm、体重 ₇₄ kg、体温 ₃₆ . ₅ ℃、血圧 ₁₄₂/₈₅ mmHg\n（検査値）\nBUN ₄₀ mg/dL、血清クレアチニン ₁ . ₄ mg/dL、eGFR ₄₂ mL/min/₁ . ₇₃ m 、\n血清アルブミン ₂ . ₆ g/dL、空腹時血糖 ₈₁ mg/dL、HbA₁c ₅ . ₆％、\nNa ₁₃₈ mEq/L、K ₄ . ₅ mEq/L、ALT ₃₅ IU/L、尿中アルブミン ₁₀₀ mg/day、\n尿アルブミン/クレアチニン比 ₈₃ . ₃ mg/gCr、尿タンパク（+）、\n尿タンパク/クレアチニン比 ₀ . ₂₅ g/gCr（簡易尿検査）\n問 229（衛生）\nこの患者が内科で出された処方箋を持って家族と来局した。この患者に服薬指導\nした際に、家族から食生活に関する質問があり、食塩の摂取を控えるよう助言し\nた。薬剤師が腎臓病に関連するリスク因子について論文検索したところ、食塩摂取\n量と末期腎不全（End Stage Renal Disease：ESRD）発症との関連性について検討\nした論文があった。その論文においては、慢性腎臓病の患者 ₅₀₀ 人のうち、₁₀₀ 人\nが ESRD を発症し、食塩 ₆ . ₀ g/日以上を摂取していた患者は ₈₅ 人であった。ま\nた、ESRD を発症した ₁₀₀ 人のうち、食塩 ₆ . ₀ g/日以上を摂取していた患者が ₂₀ 人\nであった。\n食塩摂取（₆ . ₀ g/日以上）による ESRD 発症のオッズ比として最も近い値はどれ\nか。1つ選べ。\n1     ₁.₃\n2     ₂.₃\n3     ₃.₇\n4     ₄.₁\n5     ₄.₉",
    "choices": [
      {
        "key": 1,
        "text": "₁.₃"
      },
      {
        "key": 2,
        "text": "₂.₃"
      },
      {
        "key": 3,
        "text": "₃.₇"
      },
      {
        "key": 4,
        "text": "₄.₁"
      },
      {
        "key": 5,
        "text": "₄.₉"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q229.png"
  },
  {
    "id": "r110-230",
    "year": 110,
    "question_number": 230,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "新聞報道で、致死率の高い感染症である重症熱性血小板減少症候群（SFTS）を知った中学生（14歳）と父親がドラッグストアに来局した。この親子は、夏休みに登山をすることになったので、SFTSとその感染を防ぐための方法を教えて欲しいとの相談があった。\n問230（衛生）\n\nSFTSに関する説明内容として正しいのはどれか。2つ選べ。\n（注）感染症法：感染症の予防及び感染症の患者に対する医療に関する法律",
    "choices": [
      {
        "key": 1,
        "text": "感染症法（注）においてSFTSが含まれる四類感染症は、全数報告対象とされている。"
      },
      {
        "key": 2,
        "text": "原虫によって引き起こされる感染症である。"
      },
      {
        "key": 3,
        "text": "ダニが媒介する感染症である。"
      },
      {
        "key": 4,
        "text": "SFTSに対するワクチンがある。"
      },
      {
        "key": 5,
        "text": "感染者との接触及び血液を介した感染のおそれはない。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nSFTS（重症熱性血小板減少症候群）は、感染症法に基づき四類感染症に分類されている。四類感染症を含む一類〜四類感染症の全疾患は全数報告対象であり、医師は診断後、速やかに保健所へ届出る義務がある。\n\n２　誤\n\nSFTSは原虫ではなく、SFTSウイルスによって引き起こされるウイルス感染症である。原虫感染症とは原因微生物の分類が異なる。\n\n３　正\n\nSFTSの主な感染経路は、SFTSウイルスを保有するマダニによる刺咬である。\n\n４　誤\n\n2025年時点において、SFTSに対するワクチンは実用化されていない。\n\n５　誤\n\nSFTSはマダニを介した感染が主であるが、患者の血液や体液との接触を介したヒト−ヒト感染（特に医療従事者への感染）が報告されており、接触感染のリスクがあるとされている。",
    "tags": []
  },
  {
    "id": "r110-231",
    "year": 110,
    "question_number": 231,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 230−231       新 聞 報 道 で、 致 死 率 の 高 い 感 染 症 で あ る 重 症 熱 性 血 小 板 減 少 症 候 群\n（SFTS）を知った中学生（₁₄ 歳）と父親がドラッグストアに来局した。この親子\nは、夏休みに登山をすることになったので、SFTS とその感染を防ぐための方法を\n教えて欲しいとの相談があった。\n問 231（実務）\n薬剤師はこの親子に、皮膚の露出を少なくするために長袖・長ズボンなどの衣服\nを着用することに加えて、虫よけ剤の使用を勧めた。虫よけ剤の活性成分として適\n切なのはどれか。2つ選べ。\n1     イミダクロプリド\n2     ディート\n3     イカリジン\n4     ジクロルボス\n5     ジフェンヒドラミン",
    "choices": [
      {
        "key": 1,
        "text": "イミダクロプリド"
      },
      {
        "key": 2,
        "text": "ディート"
      },
      {
        "key": 3,
        "text": "イカリジン"
      },
      {
        "key": 4,
        "text": "ジクロルボス"
      },
      {
        "key": 5,
        "text": "ジフェンヒドラミン"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q231.png"
  },
  {
    "id": "r110-232",
    "year": 110,
    "question_number": 232,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "61歳女性。肺アスペルギローマの既往。急性リンパ性白血病と診断され、シタラビン大量療法が施行された。療法開始から15日目に固形成分を含まない水様性便となったため、副作用の対応として処方1〜4の薬剤で治療開始された。しかし、症状が悪化したことから、5日後に糞便検体を採取して検査した結果、toxinA及びtoxinBが陽性であった。Clostridioides difficile感染症の院内での拡大を防止するため、院内のチームで対策を検討することになった。\n問232（実務）\n\nこの患者に処方された処方1〜4の薬剤のうち、Clostridioides difficile感染症を誘発し、下痢を悪化させた可能性のある薬剤はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "メロペネム点滴静注用"
      },
      {
        "key": 2,
        "text": "イトラコナゾール錠"
      },
      {
        "key": 3,
        "text": "ロペラミド塩酸塩カプセル"
      },
      {
        "key": 4,
        "text": "メトクロプラミド錠"
      },
      {
        "key": 5,
        "text": "酪酸菌(宮入菌)製剤錠"
      }
    ],
    "correct_answer": 1,
    "explanation": "抗菌薬の投与により腸内細菌叢のバランスが崩れると、Clostridioides difficile（C. difficile）が異常に増殖し、毒素を産生して偽膜性大腸炎を発症することがある。\n\n１　正\n\nメロペネム点滴静注用は、カルバペネム系抗菌薬であり、広範な抗菌スペクトルを有するため、腸内常在菌にも強く作用し、結果的にC. difficile感染症を誘発することがある。\n\n２　誤\n\nイトラコナゾールは、アゾール系抗真菌薬であり、C. difficile感染症を誘発させる可能性は低い。\n\n３　誤\n\nロペラミド塩酸塩カプセルは、止瀉薬であり、C. difficile感染症を誘発させる可能性は低い。なお、本剤の使用により毒素の腸内停滞が助長され、C. difficile感染症を悪化させるおそれがあるため、同感染症が疑われる場合には禁忌とされる。\n\n４　誤\n\nメトクロプラミド錠は、制吐薬であり、C. difficile感染症を誘発させる可能性は低い。\n\n５　誤\n\n酪酸菌製剤は、腸内細菌叢のバランスを整える整腸剤であり、抗菌薬による腸内細菌叢の乱れを補う目的で使用され、C. difficil",
    "tags": []
  },
  {
    "id": "r110-233",
    "year": 110,
    "question_number": 233,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 232−233      ₆₁ 歳女性。肺アスペルギローマの既往。急性リンパ性白血病と診断され、\nシタラビン大量療法が施行された。療法開始から ₁₅ 日目に固形成分を含まない水\n様性便となったため、副作用の対応として処方 ₁ ～ ₄ の薬剤で治療開始された。し\nかし、症状が悪化したことから、 ₅ 日後に糞便検体を採取して検査した結果、\ntoxin A 及び toxin B が陽性であった。Clostridioides difficile 感染症の院内での拡\n大を防止するため、院内のチームで対策を検討することになった。\n（処方 ₁ ）\n点滴静注   メロペネム点滴静注用（ ₁ g/バイアル         ₁ 本） ₁ g\n生理食塩液 ₁₀₀ mL\n₁日₃回    ₈ 時間ごと   ₃₀ 分かけて投与          ₇ 日連日投与\n（処方 ₂ ）\nイトラコナゾール錠 ₁₀₀ mg       ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食直後        ₇ 日分\n（処方 ₃ ）\nロペラミド塩酸塩カプセル ₁ mg      ₁ 回 ₁ カプセル（ ₁ 日 ₂ カプセル）\n₁日₂回    朝夕食後        ₇ 日分\n（処方 ₄ ）\nメトクロプラミド錠 ₅ mg         ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\n酪酸菌（宮入菌）製剤錠 ₂₀ mg      ₁ 回 ₂ 錠（ ₁ 日 ₆ 錠）\n₁日₃回    朝昼夕食前        ₇ 日分\n問 233（衛生）\nこの患者から広がる可能性がある院内感染症とその防止のため、薬剤師が備えて\nおくべき知識として、正しいのはどれか。2つ選べ。\n1      この感染症の主な感染経路は間接伝播である。\n2 この原因菌は芽胞を形成するので、この患者が使用した食器の消毒には煮沸消\n毒（₁₀₀ ℃、₃₀ 分）が有効である。\n3      消毒用エタノールによる手指の消毒が有効である。\n4      クレゾール石けんと流水による手洗いが有効である。\n5      便座等の消毒には次亜塩素酸ナトリウムが有効である。",
    "choices": [
      {
        "key": 1,
        "text": "この感染症の主な感染経路は間接伝播である。"
      },
      {
        "key": 2,
        "text": "消毒用エタノールによる手指の消毒が有効である。"
      },
      {
        "key": 3,
        "text": "クレゾール石けんと流水による手洗いが有効である。"
      },
      {
        "key": 4,
        "text": "便座等の消毒には次亜塩素酸ナトリウムが有効である。"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q233.png"
  },
  {
    "id": "r110-234",
    "year": 110,
    "question_number": 234,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "55歳女性。身長160cm、体重70kg。地域のイベントの一つとして、近所の薬局で開催された健康フェアに参加した。糖分を多く含む飲料を好み、運動習慣がほとんどなく、ここ10年来、健康診断を受けていなかった。薬局において血圧、指の穿刺血液による空腹時血糖値HbA1c値及び総コレステロール値を測定したところ、血圧は135/85mmHg、空腹時血糖値は120mg/dL、HbA1c値は5.8%、総コレステロール値は220mg/dLであった。薬剤師が受診を勧めたところ、受診前にできることとして、生活習慣の改善や特定保健用食品（トクホ）について質問された。\n問234（衛生）\n\n薬剤師の助言として適しているのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "適度な運動習慣を身につけ、適正体重に近づけてください。"
      },
      {
        "key": 2,
        "text": "低タンパク質で高脂肪の食事を心がけてください。"
      },
      {
        "key": 3,
        "text": "血糖値が気になる方には、難消化性デキストリンを含むトクホがあります。"
      },
      {
        "key": 4,
        "text": "血圧が高めの方には、キシリトールを含むトクホがあります。"
      },
      {
        "key": 5,
        "text": "コレステロールが高めの方には、ラクトトリペプチドを含むトクホがあります。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nこの女性の BMIは27.3（70kg ÷ 1.6m ÷ 1.6m）であり、肥満に該当する。肥満は糖尿病や脂質異常症、心血管疾患などのリスク因子であるため、運動習慣の定着によって標準体重を目指すことが望ましい。\n\n２　誤\n\n肥満傾向のある人には、高脂肪食を避ける必要があり、むしろ「高タンパク・低脂質」な食事が推奨される。脂質はエネルギー密度が高く、過剰摂取につながりやすいため、エネルギー制限が必要な患者では脂質の制限が特に重要である。\n\n３　正\n\n難消化性デキストリンは、水溶性食物繊維の一種で、特定保健用食品（トクホ）の関与成分として用いられている。\n\n主に以下の作用を有する\n\n・食後血糖値の上昇を緩やかにする作用\n\n・血中中性脂肪の上昇を抑制\n\n・整腸作用（腸内の善玉菌増殖促進）\n\n４　誤\n\nキシリトールは、歯の再石灰化を促進する作用があり、歯の健康が気になる方向けのトクホである。一方、高血圧が気になる方に適したトクホには「ラクトトリペプチド」などが関与成分として含まれる。\n\n５　誤\n\nラクトトリペプチドは、高血圧対策向けの成分であり、コレステロール高めの方には不適切である",
    "tags": []
  },
  {
    "id": "r110-235",
    "year": 110,
    "question_number": 235,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 234−235    ₅₅ 歳女性。身長 ₁₆₀ cm、体重 ₇₀ kg。地域のイベントの一つとして、近所\nの薬局で開催された健康フェアに参加した。糖分を多く含む飲料を好み、運動習慣\nがほとんどなく、ここ ₁₀ 年来、健康診断を受けていなかった。薬局において血\n圧、指の穿刺血液による空腹時血糖値、HbA₁c 値及び総コレステロール値を測定\nし た と こ ろ、 血 圧 は ₁₃₅/₈₅ mmHg、 空 腹 時 血 糖 値 は ₁₂₀ mg/dL、HbA₁c 値 は\n₅ . ₈％、総コレステロール値は ₂₂₀ mg/dL であった。薬剤師が受診を勧めたとこ\nろ、受診前にできることとして、生活習慣の改善や特定保健用食品（トクホ）につ\nいて質問された。\n問 235（実務）\nこの女性は生活習慣に改善がみられず、再び健康フェアに参加した際に受診勧奨\nさ れ、 近 医 を 受 診 し た。 血 圧 は ₁₆₀/₉₅ mmHg、 空 腹 時 血 糖 値 は ₁₄₅ mg/dL、\nHbA₁c 値は ₆ . ₈％であった。患者は運動療法・食事療法を実施していたが、改善\nしなかったため、処方 ₁ と ₂ が出され来局した。\n（処方 ₁ ）\nエナラプリルマレイン酸塩錠 ₅ mg        ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₁₄ 日分\n（処方 ₂ ）\nメトホルミン塩酸塩錠 ₂₅₀ mg         ₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回    朝夕食後    ₁₄ 日分\n薬剤師からこの患者への指導として適切でないのはどれか。1つ選べ。\n1     まぶたや唇の腫れなどを認めた場合には教えてください。\n2     悪心、下痢などを認めた場合には教えてください。\n3     空咳などを認めた場合には教えてください。\n4     副作用予防のため適度に水分を摂取してください。\n5     バリウム造影剤を用いる検査は受けないでください。",
    "choices": [
      {
        "key": 1,
        "text": "まぶたや唇の腫れなどを認めた場合には教えてください。"
      },
      {
        "key": 2,
        "text": "悪心、下痢などを認めた場合には教えてください。"
      },
      {
        "key": 3,
        "text": "空咳などを認めた場合には教えてください。"
      },
      {
        "key": 4,
        "text": "副作用予防のため適度に水分を摂取してください。"
      },
      {
        "key": 5,
        "text": "バリウム造影剤を用いる検査は受けないでください。"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q235.png"
  },
  {
    "id": "r110-236",
    "year": 110,
    "question_number": 236,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "50歳男性。慢性腎臓病ステージ3b。脳梗塞急性期で経口摂取できず、3日間末梢静脈栄養を投与していたが、栄養不足が懸念されることから、主治医より完全静脈栄養（Total　Parenteral　Nutrition：TPN）の処方設計について薬剤師に相談があり、協働して実施することになった。\n問236（実務）\n\n処方を設計する際に、検討すべきこととして適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "腎機能への影響を考慮し、分岐鎖アミノ酸（BCAA）を投与する。"
      },
      {
        "key": 2,
        "text": "低リン血症のリスクがあるため、リン酸二カリウム製剤を投与する。"
      },
      {
        "key": 3,
        "text": "代謝性アルカローシスのリスクがあるため、生理食塩液や塩化カリウム製剤を投与する。"
      },
      {
        "key": 4,
        "text": "低カルシウム血症のリスクがあるため、活性型ビタミンD3製剤を投与する。"
      },
      {
        "key": 5,
        "text": "腎不全が進行した場合、カリウム製剤を積極的に投与する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n慢性腎臓病（CKD）患者では、タンパク質制限や食欲不振、炎症性サイトカインの影響などにより、筋肉量の減少や栄養障害が生じやすい。特に、分岐鎖アミノ酸（BCAA：バリン・ロイシン・イソロイシン）は体内で合成できない必須アミノ酸であり、摂取不足が問題となる。BCAAは筋肉の維持、肝機能改善、エネルギー源として重要な役割を果たすため、CKD患者に対してはBCAAを含む栄養補助が推奨される場合がある。\n\n２　誤\n\nCKDでは、腎機能の低下によりリンの排泄能力が低下し、高リン血症になりやすい。高リン血症は二次性副甲状腺機能亢進症や血管石灰化のリスクを高め、心血管疾患の原因にもなる。\n\n３　誤\n\nCKD患者では、カリウム排泄の低下により高カリウム血症をきたしやすくなる。塩化カリウム製剤はカリウム補充薬であるため、高カリウム血症のリスクをさらに高めるおそれがある。CKDでは代謝性アシドーシスが起こることがあり、その補正には炭酸水素ナトリウムの投与が推奨される。\n\n４　正\n\nCKDでは、腎臓におけるビタミンDの活性化が障害される。この結果、活性型ビタミンD（カルシトリオール）の不足が生じ、腸",
    "tags": []
  },
  {
    "id": "r110-237",
    "year": 110,
    "question_number": 237,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 236−237 ₅₀ 歳男性。慢性腎臓病ステージ ₃b。脳梗塞急性期で経口摂取できず、\n₃ 日間末梢静脈栄養を投与していたが、栄養不足が懸念されることから、主治医よ\nり完全静脈栄養（Total Parenteral Nutrition：TPN）の処方設計について薬剤師\nに相談があり、協働して実施することになった。\n問 237（衛生）\nこの男性への TPN の処方として、ブドウ糖含有率 ₅₀％の基本輸液 ₅₀₀ mL、脂\n肪乳剤（ダイズ油 ₂₀％）₁₀₀ mL、アミノ酸を ₅ ％含む総合アミノ酸輸液 ₃₇₅ mL、\n高 カ ロ リ ー 輸 液 用 微 量 元 素 製 剤 ₂ mL、 総 合 ビ タ ミ ン 剤 ₅ mL を 設 計 し た。\nAtwater 係数を用いて計算した場合、この処方における非タンパク質カロリー/窒\n素比（NPC/N）の値として最も近いのはどれか。1つ選べ。\nただし、脂肪乳剤（ダイズ油 ₂₀％）₁₀₀ mL に含まれる熱量を ₂₀₀ kcal、アミノ\n酸は ₁₆％の窒素を含むものとする。\n1     ₁₀₀\n2     ₂₀₀\n3     ₃₀₀\n4     ₄₀₀\n5     ₅₀₀",
    "choices": [
      {
        "key": 1,
        "text": "₁₀₀"
      },
      {
        "key": 2,
        "text": "₂₀₀"
      },
      {
        "key": 3,
        "text": "₃₀₀"
      },
      {
        "key": 4,
        "text": "₄₀₀"
      },
      {
        "key": 5,
        "text": "₅₀₀"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q237.png"
  },
  {
    "id": "r110-238",
    "year": 110,
    "question_number": 238,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "海外の規制当局より、メトホルミン塩酸塩を含有する製剤(特定のロット)からN-ニトロソジメチルアミン(NDMA)が検出されたとの発表があった。10年間にわたってメトホルミン塩酸塩含有製剤を服用してきた患者(体重50kg)がこのニュースを見て来局し、健康に対するリスクを教えて欲しいという相談があった。そこで、公表されているNDMAの含有量を調べたところ、メトホルミン塩酸塩1,000mg当たり0.08μgのNDMAが含まれていることがわかった。薬剤師は、10年間服用した場合の発がんリスクを計算し、患者に伝えることとした。\n問238（衛生）\n\nこの患者が、このメトホルミン塩酸塩含有製剤を、1日当たり1,500mgの用量で10年間にわたって服用したとき、増加すると推定される発がんリスクに最も近い値はどれか。1つ選べ。ただし、NDMAの実質安全量（体重50kgの成人が生涯（70年間）曝露した場合に発がんリスクが1.0×10－5増加する曝露量)を0.1μg/日とし、発がんリスクは服用量及び服用期間に比例するものとする。",
    "choices": [
      {
        "key": 1,
        "text": "1.0×10－7"
      },
      {
        "key": 2,
        "text": "1.7×10－7"
      },
      {
        "key": 3,
        "text": "5.9×10－7"
      },
      {
        "key": 4,
        "text": "1.7×10－6"
      },
      {
        "key": 5,
        "text": "5.9×10－5"
      }
    ],
    "correct_answer": 4,
    "explanation": "①：NMDAの1日あたり摂取量を求める\n\nメトホルミン塩酸塩製剤1,000mg中に NDMAが0.08 μg含まれている。\n\nよって、1,500mg中に含まれているNDMA量は下記のように計算することができる。\n\n0.08µg/1,000mg×1,500mg／日＝0.12µg／日\n\n②：NDMAの実質安全量と10年間の発がんリスクの比較\n\n・NDMAの実質安全量は0.1μg/日。\n\n・これを70年間（生涯）摂取したと仮定して、発がんリスクは1×10－5増加とされている。\n\nよって、10年間での発がんリスクXは、下記のように計算することができる。\n\n　70年：10年＝1：X　X＝1.4×10－6\n\n③ 実際の摂取量によるリスクの補正\n\nこの患者の実際の摂取量は0.12μg /日。\n\n基準の0.1μg /日と比較すると、0.12÷0.1＝1.2倍となる。\n\nよって、実際の発がんリスクは、1.4×10−6×1.2＝1.7×10−6となる。",
    "tags": []
  },
  {
    "id": "r110-239",
    "year": 110,
    "question_number": 239,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 238−239    海外の規制当局より、メトホルミン塩酸塩を含有する製剤（特定のロッ\nト）から N︲ニトロソジメチルアミン（NDMA）が検出されたとの発表があっ\nた。₁₀ 年間にわたってメトホルミン塩酸塩含有製剤を服用してきた患者（体重\n₅₀ kg）がこのニュースを見て来局し、健康に対するリスクを教えて欲しいという\n相談があった。そこで、公表されている NDMA の含有量を調べたところ、メトホ\nルミン塩酸塩 ₁ , ₀₀₀ mg 当たり ₀ . ₀₈ ng の NDMA が含まれていることがわかっ\nた。薬剤師は、₁₀ 年間服用した場合の発がんリスクを計算し、患者に伝えること\nとした。\n問 239（実務）\nNDMA が検出されたメトホルミン塩酸塩を服用したことによるリスクは極めて\n低く、これまでに国内外において重篤な健康被害が発生したとの報告はない。\nこの患者に対する薬剤師の説明内容として、適切なのはどれか。2つ選べ。\n1     NDMA によるがんの発症には、閾値があること。\n2     摂取した NDMA の量は、実質安全量を下回っていること。\n3     他の同種同効薬に変更する必要があること。\n4     血糖値が落ち着いていれば服用を止め、次回受診時に医師に報告すること。\n5     必要に応じて、発がんリスクに関する情報を医師に提供できること。",
    "choices": [
      {
        "key": 1,
        "text": "NDMA によるがんの発症には、閾値があること。"
      },
      {
        "key": 2,
        "text": "摂取した NDMA の量は、実質安全量を下回っていること。"
      },
      {
        "key": 3,
        "text": "他の同種同効薬に変更する必要があること。"
      },
      {
        "key": 4,
        "text": "血糖値が落ち着いていれば服用を止め、次回受診時に医師に報告すること。"
      },
      {
        "key": 5,
        "text": "必要に応じて、発がんリスクに関する情報を医師に提供できること。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q239.png"
  },
  {
    "id": "r110-240",
    "year": 110,
    "question_number": 240,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "2歳8ヶ月女児。1週間前から腹痛を訴えることがあり、今朝になって、嘔吐したため、近医を受診した。母親からの聞き取りでは、日頃から鉛を含む金属製アクセサリーを舐める癖があり、誤飲したおそれがあるとのことであった。レントゲン検査では異物は見当たらなかった。尿中のδ-アミノレブリン酸濃度は10mg/Lと高値であった。また、血液検査では有核赤血球数の増加がみられ、赤血球遊離プロトポルフィリン濃度は180μg/dL（基準値30〜86μg/dL）、原子吸光光度計で測定した血中鉛濃度は75μg/dLであった。\n問240（実務）\n\n薬剤師が医師に提案する解毒薬として適切なのはどれか。２つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "EDTAカルシウム二ナトリウム"
      },
      {
        "key": 2,
        "text": "ホメピゾール"
      },
      {
        "key": 3,
        "text": "メチレンブルー"
      },
      {
        "key": 4,
        "text": "亜硝酸アミル"
      },
      {
        "key": 5,
        "text": "ジメルカプロール（BAL）"
      }
    ],
    "correct_answer": 1,
    "explanation": "本症例では、鉛を含むアクセサリーの経口曝露が疑われており、以下の所見から鉛中毒と推察される。\n\n・消化器症状（腹痛、嘔吐）\n\n・尿中δ-アミノレブリン酸の上昇\n\n・有核赤血球の増加\n\n・赤血球遊離プロトポルフィリンの高値\n\n・血中鉛濃度の異常高値\n\n１　正\n\nEDTA（エチレンジアミン四酢酸）カルシウム二ナトリウムは、鉛中毒に広く用いられる。鉛と強固なキレートを形成し、尿中への排泄を促進する作用を有する。\n\n２　誤\n\nホメピゾールは、エチレングリコール中毒やメタノール中毒に使用される解毒薬であり、鉛中毒には無効である。\n\n３　誤\n\nメチレンブルーは、中毒性メトヘモグロビン血症に対する解毒薬であり、鉛中毒には無効である。\n\n４　誤\n\n亜硝酸アミルは、シアン化物中毒やアジ化ナトリウム中毒などに使用される薬剤であり、鉛中毒には無効である。\n\n５　正\n\nジメルカプロール（BAL）は、鉛をはじめとする重金属中毒（ヒ素、水銀、銅、クロムなど）に対して使用される解毒薬である。",
    "tags": []
  },
  {
    "id": "r110-241",
    "year": 110,
    "question_number": 241,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 240−241      ₂ 歳 ₈ ケ月女児。 ₁ 週間前から腹痛を訴えることがあり、今朝になって、\n嘔吐したため、近医を受診した。母親からの聞き取りでは、日頃から鉛を含む金属\n製アクセサリーを舐める癖があり、誤飲したおそれがあるとのことであった。レン\nトゲン検査では異物は見当たらなかった。尿中の d︲アミノレブリン酸濃度は\n₁₀ mg/L と高値であった。また、血液検査では有核赤血球数の増加がみられ、赤\n血球遊離プロトポルフィリン濃度は ₁₈₀ ng/dL（基準値 ₃₀～₈₆ ng/dL）、原子吸光\n光度計で測定した血中鉛濃度は ₇₅ ng/dL であった。\n問 241（衛生）\nヘムの生合成経路を表した下図中の 1 ～ 5 のうち、この女児の中毒原因物質に\nよって抑制される反応はどれか。2つ選べ。\nO                                                                                                  CO2H          CO2H\nCoA                                                         O\nS                 CO2H\n1          H2N\n2                                              3\nスクシニル CoA                                                            CO2H                        H2N\nN\nd︲アミノレブリン酸                                                       H\nH2N        CO2H\nポルフォビリノーゲン\nグリシン\nCO2H                                                  CO2H                                                  CO2H\nCO2H                                                  CO2H\nCH3\nHO2C                                                HO2C\nH3C\nCO2H                                                     CO2H                                              CO2H\nNH     HN                                             NH      HN                                            NH         HN\nHO\nNH     HN                                             NH      HN                                            NH         HN\nHO2C\nH3C                                CH3\nCO2H         HO2C                                          CO2H\nHO2C\nCO2H                      HO2C                        CO2H                    HO2C                            CO2H\nヒドロキシメチルビラン                                                ウロポルフィリノーゲンⅢ                                            コプロポルフィリノーゲンⅢ\nCH2                                                    CH2                                                       CH2\nCH3                                                        CH3                                                      CH3\nH3C                                                         H3C                                                  H3C\nCH2                                                         CH2                                                    CH2\nNH        HN                                              N       HN                                             N             N\n4                                                          5                            Fe（Ⅱ）\nNH        HN                                              NH          N                                          N             N\nH3C                                  CH3                    H3C                                  CH3             H3C                                   CH3\nHO2C                          CO2H                          HO2C                        CO2H                        HO2C                         CO2H\nプロトポルフィリノーゲンⅨ                                                     プロトポルフィリンⅨ                                                       ヘム",
    "choices": [
      {
        "key": 1,
        "text": "H2N"
      },
      {
        "key": 2,
        "text": "5                            Fe（Ⅱ）"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q241.png"
  },
  {
    "id": "r110-242",
    "year": 110,
    "question_number": 242,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 242−243         ある高校で、夏休み前の ₇ 月に野球大会を開催することとなった。大会当\n日に、熱中症を防止する目的で、体育の教諭がグラウンドの中央付近の高さ約 ₁ m\nの地点で、乾球温度計及び黒球温度計を用いて温度を測定した。また、同時に電気\n式湿度計で相対湿度を測定した。午前 ₈ 時及び午後 ₂ 時の測定結果を表 ₁ に示し\nた。\n表₁     測定結果\n午前 ₈ 時               午後 ₂ 時\n乾球温度（℃）               ₂₈ . ₀                  ₃₂ . ₀\n黒球温度（℃）               ₃₄ . ₀                  ₃₈ . ₀\n相対湿度（％）               ₈₀ . ₀                  ₃₀ . ₀\n表₂     乾球温度と相対湿度から湿球温度（℃）を求める表（標準気圧の場合）\n相対湿度（％）\n乾球温度（℃）\n₃₀   ₃₅   ₄₀   ₄₅    ₅₀       ₅₅   ₆₀   ₆₅     ₇₀     ₇₅   ₈₀   ₈₅   ₉₀\n₂₅      ₁₅   ₁₅   ₁₆   ₁₇    ₁₈       ₁₉   ₂₀   ₂₀     ₂₁     ₂₂   ₂₂   ₂₃   ₂₄\n₂₆      ₁₅   ₁₆   ₁₇   ₁₈    ₁₉       ₂₀   ₂₀   ₂₁     ₂₂     ₂₃   ₂₃   ₂₄   ₂₅\n₂₇      ₁₆   ₁₇   ₁₈   ₁₉    ₂₀       ₂₀   ₂₁   ₂₂     ₂₃     ₂₄   ₂₄   ₂₅   ₂₆\n₂₈      ₁₇   ₁₈   ₁₉   ₂₀    ₂₀       ₂₁   ₂₂   ₂₃     ₂₄     ₂₄   ₂₅   ₂₆   ₂₇\n₂₉      ₁₇   ₁₈   ₁₉   ₂₀    ₂₁       ₂₂   ₂₃   ₂₄     ₂₅     ₂₅   ₂₆   ₂₇   ₂₈\n₃₀      ₁₈   ₁₉   ₂₀   ₂₁    ₂₂       ₂₃   ₂₄   ₂₅     ₂₆     ₂₆   ₂₇   ₂₈   ₂₉\n₃₁      ₁₉   ₂₀   ₂₁   ₂₂    ₂₃       ₂₄   ₂₅   ₂₆     ₂₆     ₂₇   ₂₈   ₂₉   ₃₀\n₃₂      ₁₉   ₂₁   ₂₂   ₂₃    ₂₄       ₂₅   ₂₆   ₂₆     ₂₇     ₂₈   ₂₉   ₃₀   ₃₁\n₃₃      ₂₀   ₂₁   ₂₂   ₂₄    ₂₅       ₂₆   ₂₆   ₂₇     ₂₈     ₂₉   ₃₀   ₃₁   ₃₂\n₃₄      ₂₁   ₂₂   ₂₃   ₂₄    ₂₅       ₂₆   ₂₇   ₂₈     ₂₉     ₃₀   ₃₁   ₃₂   ₃₂\n問 242（衛生）\n午前 ₈ 時及び午後 ₂ 時の暑さ指数（WBGT）の値に最も近いのはどれか。1つ\n選べ。\nただし、気圧は標準気圧とする。また、屋外での WBGT は次式で求められ、湿\n球温度は表 ₂ から求めるものとする。\nWBGT（℃）= ₀ . ₇ # 湿球温度 + ₀ . ₂ # 黒球温度 + ₀ . ₁ # 乾球温度\n午前 ₈ 時 午後 ₂ 時\n1        ₂₅      ₂₂\n2        ₂₅      ₂₈\n3        ₂₇      ₂₄\n4        ₂₇      ₃₀\n5        ₂₉      ₂₆\n6        ₂₉      ₃₂",
    "choices": [
      {
        "key": 1,
        "text": "₂₅      ₂₂"
      },
      {
        "key": 2,
        "text": "₂₅      ₂₈"
      },
      {
        "key": 3,
        "text": "₂₇      ₂₄"
      },
      {
        "key": 4,
        "text": "₂₇      ₃₀"
      },
      {
        "key": 5,
        "text": "₂₉      ₂₆"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q242.png"
  },
  {
    "id": "r110-243",
    "year": 110,
    "question_number": 243,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 242−243         ある高校で、夏休み前の ₇ 月に野球大会を開催することとなった。大会当\n日に、熱中症を防止する目的で、体育の教諭がグラウンドの中央付近の高さ約 ₁ m\nの地点で、乾球温度計及び黒球温度計を用いて温度を測定した。また、同時に電気\n式湿度計で相対湿度を測定した。午前 ₈ 時及び午後 ₂ 時の測定結果を表 ₁ に示し\nた。\n表₁     測定結果\n午前 ₈ 時               午後 ₂ 時\n乾球温度（℃）               ₂₈ . ₀                  ₃₂ . ₀\n黒球温度（℃）               ₃₄ . ₀                  ₃₈ . ₀\n相対湿度（％）               ₈₀ . ₀                  ₃₀ . ₀\n表₂     乾球温度と相対湿度から湿球温度（℃）を求める表（標準気圧の場合）\n相対湿度（％）\n乾球温度（℃）\n₃₀   ₃₅   ₄₀   ₄₅    ₅₀       ₅₅   ₆₀   ₆₅     ₇₀     ₇₅   ₈₀   ₈₅   ₉₀\n₂₅      ₁₅   ₁₅   ₁₆   ₁₇    ₁₈       ₁₉   ₂₀   ₂₀     ₂₁     ₂₂   ₂₂   ₂₃   ₂₄\n₂₆      ₁₅   ₁₆   ₁₇   ₁₈    ₁₉       ₂₀   ₂₀   ₂₁     ₂₂     ₂₃   ₂₃   ₂₄   ₂₅\n₂₇      ₁₆   ₁₇   ₁₈   ₁₉    ₂₀       ₂₀   ₂₁   ₂₂     ₂₃     ₂₄   ₂₄   ₂₅   ₂₆\n₂₈      ₁₇   ₁₈   ₁₉   ₂₀    ₂₀       ₂₁   ₂₂   ₂₃     ₂₄     ₂₄   ₂₅   ₂₆   ₂₇\n₂₉      ₁₇   ₁₈   ₁₉   ₂₀    ₂₁       ₂₂   ₂₃   ₂₄     ₂₅     ₂₅   ₂₆   ₂₇   ₂₈\n₃₀      ₁₈   ₁₉   ₂₀   ₂₁    ₂₂       ₂₃   ₂₄   ₂₅     ₂₆     ₂₆   ₂₇   ₂₈   ₂₉\n₃₁      ₁₉   ₂₀   ₂₁   ₂₂    ₂₃       ₂₄   ₂₅   ₂₆     ₂₆     ₂₇   ₂₈   ₂₉   ₃₀\n₃₂      ₁₉   ₂₁   ₂₂   ₂₃    ₂₄       ₂₅   ₂₆   ₂₆     ₂₇     ₂₈   ₂₉   ₃₀   ₃₁\n₃₃      ₂₀   ₂₁   ₂₂   ₂₄    ₂₅       ₂₆   ₂₆   ₂₇     ₂₈     ₂₉   ₃₀   ₃₁   ₃₂\n₃₄      ₂₁   ₂₂   ₂₃   ₂₄    ₂₅       ₂₆   ₂₇   ₂₈     ₂₉     ₃₀   ₃₁   ₃₂   ₃₂\n問 243（実務）\n野球大会当日、複数の生徒が体調不良を訴え、保健室で手当てを受けた。この高\n校では、教育委員会が作成した「学校における熱中症対策ガイドライン」をもとに\n今後の対策を話し合うこととなり、熱中症を防止するために必要な注意事項につい\nて学校薬剤師に助言を求めた。\n学校薬剤師が学校に対して行う助言の内容として、正しいのはどれか。2つ選\nべ。\n1     乾球温度と気動が同じ場合には、湿球温度が高いほど熱中症のリスクは減少する。\n2     WBGT の算出に用いる黒球温度は、紫外線の影響を最も強く受ける。\n3     乾球温度が高い場合には、風があっても感覚温度が下がらないことがある。\n4     体育館内の競技では、熱輻射の影響が無いので熱中症のリスクはない。\n5     体が暑さに慣れていない時期は、熱中症のリスクが高まる。",
    "choices": [
      {
        "key": 1,
        "text": "乾球温度と気動が同じ場合には、湿球温度が高いほど熱中症のリスクは減少する。"
      },
      {
        "key": 2,
        "text": "WBGT の算出に用いる黒球温度は、紫外線の影響を最も強く受ける。"
      },
      {
        "key": 3,
        "text": "乾球温度が高い場合には、風があっても感覚温度が下がらないことがある。"
      },
      {
        "key": 4,
        "text": "体育館内の競技では、熱輻射の影響が無いので熱中症のリスクはない。"
      },
      {
        "key": 5,
        "text": "体が暑さに慣れていない時期は、熱中症のリスクが高まる。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q243.png"
  },
  {
    "id": "r110-244",
    "year": 110,
    "question_number": 244,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "病院で、以下の事故事例を用いて、抗がん剤シクロホスファミド水和物の調製に関する新人薬剤師の研修会を行うことになった。\n＜事故事例＞\n\nシクロホスファミド水和物の溶解に閉鎖式薬物移送システム(CSTD)で調製するところ、その器具がなかった。薬剤師は安全キャビネットを使用して、シクロホスファミド水和物500mg(凍結乾燥粉末)を生理食塩液25mLで溶解させているときに18Gの注射針がシリンジから外れ、誤って薬液を飛散させてしまった。\n問244（実務）\n\nシクロホスファミド水和物の溶解調製及び事故時の対応に関して、新人薬剤師が指導を受ける内容として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "溶解液はバイアル内を陽圧に保ちながら調製を行う。"
      },
      {
        "key": 2,
        "text": "調製にはルアーロック型のシリンジを使用する。"
      },
      {
        "key": 3,
        "text": "外径がより細い32Gの注射針を用いて調製する。"
      },
      {
        "key": 4,
        "text": "飛散した薬液は安全キャビネット内で中心部から周囲に向かって拭き取る。"
      },
      {
        "key": 5,
        "text": "薬液を拭き取った後は水を含ませたガーゼで拭き、さらに消毒用エタノールを含ませたガーゼで清拭する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n注射剤の溶解液を加える際、バイアル内が陽圧になると液が噴出するリスクがあるため、バイアル内は「陰圧」に保ちながら調製を行う必要がある。\n\n２　正\n\n抗がん剤の調製では、ルアーロック型のシリンジを使用する必要がある。ルアーロック式のシリンジは、注射器の針がしっかりロックされ、接続部からの漏れを防ぐことが可能である。一方、ルアースリップ型のシリンジは針が抜けやすく、接続が緩みやすいため、抗がん剤調製には用いられない。\n\n３　誤\n\n抗がん剤の調製では、一般的に18〜21Gの注射針を使用する。32Gのような細い針は、針抵抗が大きく薬液の吸引や注入に時間がかかるため、医薬品の調製には適さない。\n\n４　誤\n\n飛散した薬液は、汚染拡大を防ぐために「外側から中心に向かって」拭き取るのが原則である。\n\n５　正\n\n抗がん剤などの細胞障害性薬剤をこぼした場合には、以下のような対応が求められる。まず水を含んだガーゼで薬液を拭き取り（希釈や中和のため）、その後、消毒用エタノールを含んだガーゼで再度清拭する。この処理により、皮膚刺激や汚染のリスクを最小限に抑えることができる。",
    "tags": []
  },
  {
    "id": "r110-245",
    "year": 110,
    "question_number": 245,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 244−245      病院で、以下の事故事例を用いて、抗がん剤シクロホスファミド水和物の\n調製に関する新人薬剤師の研修会を行うことになった。\n＜事故事例＞\nシクロホスファミド水和物の溶解に閉鎖式薬物移送システム（CSTD）で調製\nするところ、その器具がなかった。薬剤師は安全キャビネットを使用して、シ\nクロホスファミド水和物 ₅₀₀ mg（凍結乾燥粉末）を生理食塩液 ₂₅ mL で溶解\nさせているときに ₁₈ G の注射針がシリンジから外れ、誤って薬液を飛散させ\nてしまった。\n問 245（衛生）\nこの過程で排出されたものの廃棄に関して、新人薬剤師が備えておくべき知識と\nして正しいのはどれか。2つ選べ。\n1 使用した注射針は、図Ａに示した形状のマークをつけた容器に入れて廃棄する\nことが推奨されている。\n2     拭き取りに使用したガーゼは、事業系一般廃棄物として扱う。\n3     使用後のバイアルは、特別管理産業廃棄物として扱う。\n4     使用したシリンジは、事業系一般廃棄物として扱う。\n5     調製時に用いたディスポーザブル手袋は、特別管理一般廃棄物として扱う。\n図Ａ",
    "choices": [
      {
        "key": 1,
        "text": "拭き取りに使用したガーゼは、事業系一般廃棄物として扱う。"
      },
      {
        "key": 2,
        "text": "使用後のバイアルは、特別管理産業廃棄物として扱う。"
      },
      {
        "key": 3,
        "text": "使用したシリンジは、事業系一般廃棄物として扱う。"
      },
      {
        "key": 4,
        "text": "調製時に用いたディスポーザブル手袋は、特別管理一般廃棄物として扱う。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q245.png"
  },
  {
    "id": "r110-246",
    "year": 110,
    "question_number": 246,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "30歳男性。 以下の処方 1〜3が記載された処方箋を持って薬局を訪れた。 この薬局では、1名の薬学生が実習中であった。\n問246（薬理）\n\n処方 1〜3のいずれかの薬物に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ドパミンD2受容体に部分アゴニストとして作用することで、ドパミン神経系を安定化させる。"
      },
      {
        "key": 2,
        "text": "ヒスタミンH1受容体及びアドレナリンα1受容体を刺激することで、統合失調症の陰性症状を改善する。"
      },
      {
        "key": 3,
        "text": "ドパミンD2受容体を遮断することで、統合失調症の陽性症状を改善する。"
      },
      {
        "key": 4,
        "text": "γ-アミノ酪酸GABAA受容体のベンゾジアゼピン結合部位に結合することで、睡眠を誘発する。"
      },
      {
        "key": 5,
        "text": "メラトニンMT１及びMT2受容体を刺激することで、睡眠−覚醒リズムを正常化する。"
      }
    ],
    "correct_answer": 3,
    "explanation": "◉リスペリドン\n\nドパミンD2受容体遮断作用、セロトニン5–HT2A受容体遮断作用により統合失調症の陽性症状および陰性症状を改善する。\n\n◉スルピリド\n\nドパミンD2受容体遮断作用により統合失調症の陽性症状を改善する。\n\n◉ハロペリドール\n\nドパミンD2受容体遮断作用により統合失調症の陽性症状を改善する。\n\n◉ラメルテオン\n\nメラトニンMT１及びMT2受容体を刺激することで、睡眠−覚醒リズムを正常化する。",
    "tags": []
  },
  {
    "id": "r110-247",
    "year": 110,
    "question_number": 247,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 246−247      ₃₀ 歳男性。以下の処方 ₁ ～ ₃ が記載された処方箋を持って薬局を訪れた。\nこの薬局では、 ₁ 名の薬学生が実習中であった。\n（処方 ₁ ）\nリスペリドン錠 ₁ mg    ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\nスルピリド錠 ₁₀₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\n₁日₃回       朝昼夕食後        ₁₄ 日分\n（処方 ₂ ）\nハロペリドール細粒 ₁ ％   ₁ 回 ₀ . ₆ g（ ₁ 日 ₀ . ₆ g）\n₁日₁回       朝食後      ₁₄ 日分\n（処方 ₃ ）\nラメルテオン錠 ₈ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回       就寝前      ₁₄ 日分\n問 247（実務）\n指導薬剤師は、実務実習生に下表の換算値を用いて経口抗精神病薬のクロルプロ\nマジン換算量を算出する課題を出した。この患者の ₁ 日分のクロルプロマジン換算\n量はどれか。1つ選べ。\n（経口抗精神病薬の等価換算表）\n経口クロルプロマジン ₁₀₀ mg に\n薬物\n相当する換算値\nクロルプロマジン               ₁₀₀\nスルピリド                  ₂₀₀\nハロペリドール                 ₂\nリスペリドン                  ₁\n1     ₃₀₀ mg\n2     ₄₈₀ mg\n3     ₆₆₀ mg\n4     ₇₅₀ mg\n5     ₉₀₀ mg",
    "choices": [
      {
        "key": 1,
        "text": "₃₀₀ mg"
      },
      {
        "key": 2,
        "text": "₄₈₀ mg"
      },
      {
        "key": 3,
        "text": "₆₆₀ mg"
      },
      {
        "key": 4,
        "text": "₇₅₀ mg"
      },
      {
        "key": 5,
        "text": "₉₀₀ mg"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q247.png"
  },
  {
    "id": "r110-248",
    "year": 110,
    "question_number": 248,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "16歳女性。夜間の睡眠を十分にとっていたにもかかわらず、高校での授業中に耐え難い眠気が繰り返し生じ、居眠りすることが多くなった。そのため睡眠クリニックを受診し、指導された通りに生活習慣の改善を実施したが、2週間経っても居眠りが消失しなかった。終夜睡眠ポリグラフ検査や反復睡眠潜時検査の結果からナルコレプシーと診断され、生活習慣の改善を継続するとともに、以下の処方が開始となった。\n問248（実務）\n\n処方1の薬剤及び用法について、この患者に説明する内容として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "依存性が形成される可能性があること。"
      },
      {
        "key": 2,
        "text": "流通管理のため、空のPTPシートを回収すること。"
      },
      {
        "key": 3,
        "text": "脱毛の可能性があること。"
      },
      {
        "key": 4,
        "text": "服用開始後、頭痛が生じる可能性があること。"
      },
      {
        "key": 5,
        "text": "服用期間中はカフェインを含む飲料の摂取は避けること。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nモダフィニル（以下：本剤）を使用すると、精神的依存が形成されるおそれがある。\n\n２　誤\n\n本剤における流通管理をするために下記の規則が定められている。\n\n・厳格な登録制度の導入\n\n（医師、薬剤師、医療機関、薬局は事前にWeb登録が必要）\n\n・登録センターによる情報管理と照合\n\n（調剤する際に処方医師登録状況をWebで確認）\n\n・卸売販売業者の制限\n\n（登録されていない医療機関、薬局に納入すること不可）\n\n３　誤\n\n本剤は、副作用として、脱毛を起こすとの報告はない。\n\n４　正\n\n本剤は、副作用として、頭痛が現れることがあるため、頭痛が生じる可能性がある。\n\n５　誤\n\n本剤とカフェインを含む飲料との相互作用は、報告されていない。",
    "tags": []
  },
  {
    "id": "r110-249",
    "year": 110,
    "question_number": 249,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 248−249      ₁₆ 歳女性。夜間の睡眠を十分にとっていたにもかかわらず、高校での授業\n中に耐え難い眠気が繰り返し生じ、居眠りすることが多くなった。そのため睡眠ク\nリニックを受診し、指導された通りに生活習慣の改善を実施したが、 ₂ 週間経って\nも居眠りが消失しなかった。終夜睡眠ポリグラフ検査や反復睡眠潜時検査の結果か\nらナルコレプシーと診断され、生活習慣の改善を継続するとともに、以下の処方が\n開始となった。\n（処方 ₁ ）\nモダフィニル錠 ₁₀₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回      朝食後   ₁₄ 日分\n問 249（薬理）\n服薬コンプライアンスは良好であったが、約 ₁ ケ月服用しても授業中の居眠り等\nの症状は改善しなかったため、モダフィニルが徐々に増量され、 ₃ ケ月後には\n₃₀₀ mg/日となった。モダフィニルの増量中に、「眠りにつくときに怖い夢ばかり\nみる」との訴えがあったため、処方 ₂ が追加された。その後も居眠り等の症状が十\n分に改善されなかったため、モダフィニル錠は、処方 ₃ に変更された。\n（処方 ₂ ）\nクロミプラミン塩酸塩錠 ₁₀ mg       ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    就寝前    ₁₄ 日分\n（処方 ₃ ）\nメチルフェニデート塩酸塩錠 ₁₀ mg     ₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回    朝昼食後    ₁₄ 日分\n処方 ₂ 及び処方 ₃ のいずれかの薬物の作用機序として、正しいのはどれか。2つ\n選べ。\n1 c︲アミノ酪酸（GABA）及びヒスタミンの遊離を促進する。\n2    アデノシン A1 及び A2A 受容体を遮断する。\n3    非特異的にホスホジエステラーゼを阻害する。\n4    ドパミン及びノルアドレナリンの再取り込みを阻害する。\n5    セロトニン及びノルアドレナリンの再取り込みを阻害する。",
    "choices": [
      {
        "key": 1,
        "text": "アデノシン A1 及び A2A 受容体を遮断する。"
      },
      {
        "key": 2,
        "text": "非特異的にホスホジエステラーゼを阻害する。"
      },
      {
        "key": 3,
        "text": "ドパミン及びノルアドレナリンの再取り込みを阻害する。"
      },
      {
        "key": 4,
        "text": "セロトニン及びノルアドレナリンの再取り込みを阻害する。"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q249.png"
  },
  {
    "id": "r110-250",
    "year": 110,
    "question_number": 250,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "29歳女性。5年前に潰瘍性大腸炎と診断され、メサラジン、副腎皮質ステロイド薬、タクロリムス、アザチオプリン、アダリムマブを使用してきたが、これまでの治療薬では寛解の維持が困難であった。医師はこれまでとは異なる作用機序の薬剤を新たに開始することを検討している。\n問250（薬理）\n\n新たに開始する候補薬剤の作用機序として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "IL-12及びIL-23のp40サブユニットに特異的に結合して、ヘルパーT細胞の活性化を抑制する。"
      },
      {
        "key": 2,
        "text": "TNF-αに特異的に結合して、TNF-αの作用を抑制する。"
      },
      {
        "key": 3,
        "text": "カルシューリンを阻害して、IL-2の産生を抑制する。"
      },
      {
        "key": 4,
        "text": "プリン塩基の合成を阻害して、リンパ球の増殖を抑制する。"
      },
      {
        "key": 5,
        "text": "ヤヌスキナーゼ（JAK）を阻害して、リンパ球の活性化を抑制する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "本症例では、タクロリムス（作用機序：カルシューリンを阻害して、IL-2の産生を抑制する。）、アザチオプリン（作用機序：プリン塩基の合成を阻害して、リンパ球の増殖を抑制する。）、アダリムマブ（作用機序：TNF-αに特異的に結合して、TNF-αの作用を抑制する。）が治療薬として用いられているため、新たに開始する候補薬剤の作用機序として、選択肢２、３、４は不適切である。\n\n１　正\n\nウステキヌマブは、IL-12及びIL-23のp40サブユニットに特異的に結合して、ヘルパーT細胞の活性化を抑制する。ウステキヌマブは、潰瘍性大腸炎の治療に用いられ、また、これまでの治療薬と作用機序が異なるため、新たに開始する候補薬剤として適切である。\n\n２　誤\n\n前記参照\n\n３　誤\n\n前記参照\n\n４　誤\n\n前記参照\n\n５　正\n\nトファシチニブは、ヤヌスキナーゼ（JAK）を阻害して、リンパ球の活性化を抑制する。トファシチニブは、潰瘍性大腸炎の治療に用いられ、また、これまでの治療薬と作用機序が異なるため、新たに開始する候補薬剤として適切である。",
    "tags": []
  },
  {
    "id": "r110-251",
    "year": 110,
    "question_number": 251,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 250−251      ₂₉ 歳女性。 ₅ 年前に潰瘍性大腸炎と診断され、メサラジン、副腎皮質ステ\nロイド薬、タクロリムス、アザチオプリン、アダリムマブを使用してきたが、これ\nまでの治療薬では寛解の維持が困難であった。医師はこれまでとは異なる作用機序\nの薬剤を新たに開始することを検討している。\n問 251（実務）\n患者は内服薬による治療を希望し、新たに内服薬を開始することになった。医師\nより、開始する薬剤に関する留意点について、患者への説明を依頼された。説明す\nる内容として適切なのはどれか。2つ選べ。\n1    寛解が得られた後、寛解維持期においては隔日投与となること。\n2    腎機能障害が現れやすいこと。\n3    脂質検査値の異常が現れる可能性があること。\n4    眠気が起こりやすいこと。\n5    感染症を起こしやすいこと。",
    "choices": [
      {
        "key": 1,
        "text": "寛解が得られた後、寛解維持期においては隔日投与となること。"
      },
      {
        "key": 2,
        "text": "腎機能障害が現れやすいこと。"
      },
      {
        "key": 3,
        "text": "脂質検査値の異常が現れる可能性があること。"
      },
      {
        "key": 4,
        "text": "眠気が起こりやすいこと。"
      },
      {
        "key": 5,
        "text": "感染症を起こしやすいこと。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q251.png"
  },
  {
    "id": "r110-252",
    "year": 110,
    "question_number": 252,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 252−253      ₂₈ 歳女性。高校教員として勤務している。ここ数ケ月、仕事のストレスか\nら風邪をひきやすく、体調が優れない日が続いていた。最近になり、左胸背部に赤\nい発疹が多く現れ、ピリピリとする痛みが出てきたことから、近医を受診した。診\n断の結果、帯状疱疹と診断され、以下の処方箋を持って薬局を訪れた。\n（処方）\nバラシクロビル錠 ₅₀₀ mg     ₁ 回 ₂ 錠（ ₁ 日 ₆ 錠）\nアセトアミノフェン錠 ₅₀₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\n₁日₃回    朝昼夕食後       ₇ 日分\n問 252（実務）\nこの患者への説明として、適切なのはどれか。2つ選べ。\n1    他の教職員や生徒へ感染させる危険性があるため、出勤停止となります。\n2    むくみが現れたり、尿量が減った場合は、すぐに知らせてください。\n3    帯状疱疹は再発する可能性があります。\n4    服用期間中は水分摂取を控えるようにしてください。\n5    痛みが強い時は患部を冷やしてください。",
    "choices": [
      {
        "key": 1,
        "text": "他の教職員や生徒へ感染させる危険性があるため、出勤停止となります。"
      },
      {
        "key": 2,
        "text": "むくみが現れたり、尿量が減った場合は、すぐに知らせてください。"
      },
      {
        "key": 3,
        "text": "帯状疱疹は再発する可能性があります。"
      },
      {
        "key": 4,
        "text": "服用期間中は水分摂取を控えるようにしてください。"
      },
      {
        "key": 5,
        "text": "痛みが強い時は患部を冷やしてください。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q252.png"
  },
  {
    "id": "r110-253",
    "year": 110,
    "question_number": 253,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 252−253      ₂₈ 歳女性。高校教員として勤務している。ここ数ケ月、仕事のストレスか\nら風邪をひきやすく、体調が優れない日が続いていた。最近になり、左胸背部に赤\nい発疹が多く現れ、ピリピリとする痛みが出てきたことから、近医を受診した。診\n断の結果、帯状疱疹と診断され、以下の処方箋を持って薬局を訪れた。\n（処方）\nバラシクロビル錠 ₅₀₀ mg     ₁ 回 ₂ 錠（ ₁ 日 ₆ 錠）\nアセトアミノフェン錠 ₅₀₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\n₁日₃回    朝昼夕食後       ₇ 日分\n問 253（薬理）\n処方薬で治療を継続した結果、皮疹は治まったものの、その部位で断続的な刺す\nような痛みや持続的で焼けるような痛みが生じるようになった。これらの症状に対\nして使用する薬物の作用機序として、正しいのはどれか。2つ選べ。\n1    電位依存性 Ca2+ チャネルの機能の抑制\n2    c︲アミノ酪酸 GABAB 受容体の刺激\n3    オピオイド n 受容体の刺激\n4    セロトニン ₅︲HT1B/1D 受容体の刺激\n5    カルシトニン遺伝子関連ペプチド（CGRP）受容体の遮断",
    "choices": [
      {
        "key": 1,
        "text": "電位依存性 Ca2+ チャネルの機能の抑制"
      },
      {
        "key": 2,
        "text": "c︲アミノ酪酸 GABAB 受容体の刺激"
      },
      {
        "key": 3,
        "text": "オピオイド n 受容体の刺激"
      },
      {
        "key": 4,
        "text": "セロトニン ₅︲HT1B/1D 受容体の刺激"
      },
      {
        "key": 5,
        "text": "カルシトニン遺伝子関連ペプチド（CGRP）受容体の遮断"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q253.png"
  },
  {
    "id": "r110-254",
    "year": 110,
    "question_number": 254,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "56歳男性。身長165cm、体重63kg。1年前に健診で心電図異常が見つかり、循環器内科で精密検査となった。その結果、頻脈性不整脈と診断され、ジソピラミド（50mgカプセルを1回1カプセル、1日3回朝昼夕食後服用）による治療が開始され、継続して服用していた。2週間前に動悸や立ちくらみを自覚するようになり、精密検査と治療の見直しのため入院となった。入院から4日目にジソピラミドを1日150mgから300mgに増量したが、症状が改善されなかったことから、ジソピラミドをソタロール(80mg錠を1回1錠、1日2回朝夕食後服用)に変更となった。ソタロール服用開始から5日目に、担当薬剤師が病室を訪れた際に、下図に示す心電図の異常を発見した。\n問254（薬理）\n\nこの患者に使用された2つの抗不整脈薬に共通する作用機序はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "電位依存性Na＋チャネル遮断"
      },
      {
        "key": 2,
        "text": "電位依存性Ca２＋チャネル遮断"
      },
      {
        "key": 3,
        "text": "電位依存性K＋チャネル遮断"
      },
      {
        "key": 4,
        "text": "アドレナリンβ受容体遮断"
      },
      {
        "key": 5,
        "text": "アセチルコリンM2受容体遮断"
      }
    ],
    "correct_answer": 3,
    "explanation": "ジソピラミドは、電位依存性Na＋チャネル遮断作用、電位依存性K＋チャネル遮断作用、ムスカリン受容体遮断作用を示す。また、ソタロールは、電位依存性K＋チャネル遮断作用、アドレナリンβ受容体遮断作用を示す。これらのことから、2つの抗不整脈薬に共通する作用機序は、電位依存性K＋チャネル遮断作用である。",
    "tags": []
  },
  {
    "id": "r110-255",
    "year": 110,
    "question_number": 255,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 254−255   ₅₆ 歳男性。身長 ₁₆₅ cm、体重 ₆₃ kg。 ₁ 年前に健診で心電図異常が見つか\nり、循環器内科で精密検査となった。その結果、頻脈性不整脈と診断され、ジソピ\nラミド（₅₀ mg カプセルを ₁ 回 ₁ カプセル、 ₁ 日 ₃ 回朝昼夕食後服用）による治療\nが開始され、継続して服用していた。 ₂ 週間前に動悸や立ちくらみを自覚するよう\nになり、精密検査と治療の見直しのため入院となった。入院から ₄ 日目にジソピラ\nミドを ₁ 日 ₁₅₀ mg から ₃₀₀ mg に増量したが、症状が改善されなかったことか\nら、ジソピラミドをソタロール（₈₀ mg 錠を ₁ 回 ₁ 錠、 ₁ 日 ₂ 回朝夕食後服用）に\n変更となった。ソタロール服用開始から ₅ 日目に、担当薬剤師が病室を訪れた際\nに、下図に示す心電図の異常を発見した。\n（心電図）\n₁ マスは、横軸が ₀ . ₀₄ 秒、縦軸が ₀ . ₁ mV\n問 255（実務）\n認められた心電図異常はどれか。2つ選べ。\n1    ST 上昇\n2    房室ブロック\n3    徐脈\n4    QT 延長\n5    テント状 T 波の出現",
    "choices": [
      {
        "key": 1,
        "text": "ST 上昇"
      },
      {
        "key": 2,
        "text": "房室ブロック"
      },
      {
        "key": 3,
        "text": "QT 延長"
      },
      {
        "key": 4,
        "text": "テント状 T 波の出現"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q255.png"
  },
  {
    "id": "r110-256",
    "year": 110,
    "question_number": 256,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "63歳男性。5年前に糖尿病性腎症と診断され、シタグリプチンリン酸塩水和物、アルファカルシドール、ニフェジピン酸化マグネシウム、セベラマー塩酸塩、ポリスチレンスルホン酸カルシウムで治療してきた。2年前に貧血症状が現れ、ダルベポエチンアルファ（遺伝子組換え）が追加された。現在のダルベポエチンアルファ（遺伝子組換え）の用法・用量は、処方1のとおりである。\n最近、血液中のヘモグロビン濃度が低下し、目標値を維持することができておらず、その原因も不明であった。なお、血清フェリチン値は126ng/mL、トランス・フェリン飽和度は33%と正常域にある。この状態をふまえて、腎臓内科医は、処方1から処方2へ変更した。\n問256（薬理）\n\n　処方1又は処方2の薬物の作用機序として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "補体C5に結合することで、補体C5を介した赤血球の破壊を抑制する。"
      },
      {
        "key": 2,
        "text": "チミジル酸合成酵素の補酵素として作用することで、赤血球の産生を促進する。"
      },
      {
        "key": 3,
        "text": "ヘム合成酵素の補酵素として作用することで、ヘムの合成を促進する。"
      },
      {
        "key": 4,
        "text": "赤芽球系前駆細胞に作用することで、赤血球への分化を促進する。"
      },
      {
        "key": 5,
        "text": "低酸素誘導因子（HIF）プロリン水酸化酵素を阻害することで、HIFを介したエリスロポエチンの産生を促進する。"
      }
    ],
    "correct_answer": 4,
    "explanation": "１　誤\n\nエクリズマブに関する記述である。エクリズマブは、補体C5に結合することで、補体C5を介した赤血球の破壊を抑制する。\n\n２　誤\n\n葉酸に関する記述である。葉酸は、チミジル酸合成酵素の補酵素として作用することで、赤血球の産生を促進する。\n\n３　誤\n\nピリドキサールリン酸に関する記述である。ピリドキサールリン酸は、ヘム合成酵素の補酵素として作用することで、ヘムの合成を促進する。\n\n４　正\n\nダルベポエチンアルファ（遺伝子組換え）は、赤芽球系前駆細胞に作用することで、赤血球への分化を促進する。\n\n５　正\n\nダプロデュスタットは、低酸素誘導因子（HIF）プロリン水酸化酵素を阻害することで、HIFを介したエリスロポエチンの産生を促進する。",
    "tags": []
  },
  {
    "id": "r110-257",
    "year": 110,
    "question_number": 257,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 256−257     ₆₃ 歳男性。 ₅ 年前に糖尿病性腎症と診断され、シタグリプチンリン酸塩水\n和物、アルファカルシドール、ニフェジピン、酸化マグネシウム、セベラマー塩酸\n塩、ポリスチレンスルホン酸カルシウムで治療してきた。 ₂ 年前に貧血症状が現\nれ、ダルベポエチンアルファ（遺伝子組換え）が追加された。現在のダルベポエチ\nンアルファ（遺伝子組換え）の用法・用量は、処方 ₁ のとおりである。\n（処方 ₁ ）\nダルベポエチンアルファ（遺伝子組換え）注射液 ₁₂₀ ng            ₁回₁本\n静脈内投与     ₂ 週間に ₁ 回    ₄ 週分\n最近、血液中のヘモグロビン濃度が低下し、目標値を維持することができておら\nず、その原因も不明であった。なお、血清フェリチン値は ₁₂₆ ng/mL、トランス\nフェリン飽和度は ₃₃％と正常域にある。この状態をふまえて、腎臓内科医は、処\n方 ₁ から処方 ₂ へ変更した。\n（処方 ₂ ）\nダプロデュスタット錠 ₄ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₁₄ 日分\n問 257（実務）\n処方 ₂ の薬剤の重大な副作用はどれか。1つ選べ。\n1     心室性不整脈\n2     白血球減少\n3     低血圧\n4     血栓塞栓症\n5     下痢",
    "choices": [
      {
        "key": 1,
        "text": "心室性不整脈"
      },
      {
        "key": 2,
        "text": "白血球減少"
      },
      {
        "key": 3,
        "text": "低血圧"
      },
      {
        "key": 4,
        "text": "血栓塞栓症"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q257.png"
  },
  {
    "id": "r110-258",
    "year": 110,
    "question_number": 258,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "65歳男性。最近、尿意を我慢できなくなってきたため、近くの泌尿器科を受診したところ、過活動膀胱と診断され、行動療法とともに以下の処方で治療を開始することとなった。当薬局への来局は今回が初めてであったことから、お薬手帳この確認と聞き取りを行った。\n患者からの聞き取りにて、眼科通院中で、お薬手帳に記載の点眼液を使用中であることを泌尿器科の処方医に伝えていなかったことが分かった。\n問258（実務）\n\n眼科において治療中と考えられる疾患として、最も可能性が高いのはどれか。１つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "加齢黄斑変性"
      },
      {
        "key": 2,
        "text": "白内障"
      },
      {
        "key": 3,
        "text": "緑内障"
      },
      {
        "key": 4,
        "text": "ぶどう膜炎"
      },
      {
        "key": 5,
        "text": "流行性角結膜炎"
      }
    ],
    "correct_answer": 3,
    "explanation": "お薬手帳にラタノプロスト点眼液（薬効薬理：FP受容体を刺激することによりぶどう膜強膜からの房水流出を促進し、眼圧を低下させる）、ドルゾラミド塩酸塩点眼液（薬効薬理：毛様体上皮細胞の炭酸脱水酵素を阻害することにより房水産生を抑制し、眼圧を低下させる）が記載されていることから、緑内障治療中であると推察できる。",
    "tags": []
  },
  {
    "id": "r110-259",
    "year": 110,
    "question_number": 259,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 258−259       ₆₅ 歳男性。最近、尿意を我慢できなくなってきたため、近くの泌尿器科を\n受診したところ、過活動膀胱と診断され、行動療法とともに以下の処方で治療を開\n始することとなった。当薬局への来局は今回が初めてであったことから、お薬手帳\nの確認と聞き取りを行った。\n（処方）\nソリフェナシンコハク酸塩錠 ₅ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₁₄ 日分\n（お薬手帳の内容）\nラタノプロスト点眼液            ₁日₁回₁滴\nドルゾラミド塩酸塩点眼液          ₁日₁回₁滴\n患者からの聞き取りにて、眼科通院中で、お薬手帳に記載の点眼液を使用中であ\nることを泌尿器科の処方医に伝えていなかったことが分かった。\n問 259（薬理）\n前問で最も可能性が高い疾患を患者が治療中であることを眼科医に確認できたの\nで、泌尿器科の医師に処方変更を提案することにした。提案する薬物の作用機序と\nして適切なのはどれか。1つ選べ。\n1     アドレナリン a1 受容体刺激\n2     アドレナリン b3 受容体刺激\n3     アセチルコリン M3 受容体遮断\n4     アンドロゲン受容体遮断\n5     ミネラルコルチコイド受容体（アルドステロン受容体）遮断",
    "choices": [
      {
        "key": 1,
        "text": "アドレナリン a1 受容体刺激"
      },
      {
        "key": 2,
        "text": "アドレナリン b3 受容体刺激"
      },
      {
        "key": 3,
        "text": "アセチルコリン M3 受容体遮断"
      },
      {
        "key": 4,
        "text": "アンドロゲン受容体遮断"
      },
      {
        "key": 5,
        "text": "ミネラルコルチコイド受容体（アルドステロン受容体）遮断"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q259.png"
  },
  {
    "id": "r110-260",
    "year": 110,
    "question_number": 260,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "48歳男性。2ヶ月前から食欲の低下を感じ、消化器内科で精査したところ、ヘリコバクター・ピロリ陽性と診断され、一次除菌を行うこととなった。\n問260（実務）\n\nこの処方薬の服薬指導時の患者への説明として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ボノプラザン錠は、服用時に噛んだり、砕いたりすると効果が減弱します。"
      },
      {
        "key": 2,
        "text": "よくみられる副作用として、腹痛や頻回の下痢があります。"
      },
      {
        "key": 3,
        "text": "味覚異常が現れることがありますが、多くの場合数日で治まります。"
      },
      {
        "key": 4,
        "text": "服用期間中は激しい運動を控えてください。"
      },
      {
        "key": 5,
        "text": "処方分の薬を飲み終えた後、すぐに除菌の判定を行います。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\nボノプラザン錠は、フィルムコーティング錠であるが、服用時に噛んだり、砕いたりしても効果は減弱しない。\n\n２　正\n\nボノサップパック（本剤）は、副作用として、腹痛、下痢を起こすことがある。\n\n３　正\n\n本剤は、副作用として、味覚異常を起こすことがあるが、多くの場合2〜3日で治癒する。\n\n４　誤\n\n本剤服用期間中は、激しい運動を控える必要はない。\n\n５　誤\n\n本剤を飲み終えた後、4週間以上あけてから除菌の判定を行う。",
    "tags": []
  },
  {
    "id": "r110-261",
    "year": 110,
    "question_number": 261,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 260−261      ₄₈ 歳男性。 ₂ ケ月前から食欲の低下を感じ、消化器内科で精査したとこ\nろ、ヘリコバクター・ピロリ陽性と診断され、一次除菌を行うこととなった。\n（処方）\nボノサップパック ₄₀₀         ₁ シート\n（注）\n₁日₂回    朝夕食後   ₇ 日分\n注： ₁ 回分として、ボノプラザン錠 ₂₀ mg        ₁ 錠、アモキシシリンカプセル\n₂₅₀ mg   ₃ カプセル、クラリスロマイシン錠 ₂₀₀ mg        ₁ 錠を服用\n問 261（薬理）\nヘリコバクター・ピロリの除菌療法において、ボノプラザン以外にラベプラゾー\nルも用いられてきた。ボノプラザン又はラベプラゾールに関する記述として、正し\nいのはどれか。2つ選べ。\n1     ボノプラザンは、壁細胞における H ，K ︲ATPase の発現を抑制する。\n+   +\n2     ボノプラザンは、胃酸による活性化を必要としない。\n3     ボノプラザンは、弱酸性であり、壁細胞内に分子形として集積する。\n4     ラベプラゾールは、K と競合して、壁細胞からの H 分泌を阻害する。\n+                +\n5     ラベプラゾールは、H ，K ︲ATPase とジスルフィド結合を形成する。\n+   +",
    "choices": [
      {
        "key": 1,
        "text": "ボノプラザンは、壁細胞における H ，K ︲ATPase の発現を抑制する。 +   +"
      },
      {
        "key": 2,
        "text": "ボノプラザンは、胃酸による活性化を必要としない。"
      },
      {
        "key": 3,
        "text": "ボノプラザンは、弱酸性であり、壁細胞内に分子形として集積する。"
      },
      {
        "key": 4,
        "text": "ラベプラゾールは、K と競合して、壁細胞からの H 分泌を阻害する。 +                +"
      },
      {
        "key": 5,
        "text": "ラベプラゾールは、H ，K ︲ATPase とジスルフィド結合を形成する。 +   +"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q261.png"
  },
  {
    "id": "r110-262",
    "year": 110,
    "question_number": 262,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "65歳男性。2型糖尿病のため処方1〜3にて治療していた。\n最近、血糖コントロールが不良であることから、今回、処方3が処方4へ変更となり、処方1、2及び4が記載された処方箋を持ってかかりつけ薬局を訪れた。\n問262（実務）\n\n処方変更に関して、医師に疑義照会すべき内容はどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "セマグルチドの投与剤形"
      },
      {
        "key": 2,
        "text": "セマグルチド錠の服用タイミング"
      },
      {
        "key": 3,
        "text": "セマグルチド錠の開始用量"
      },
      {
        "key": 4,
        "text": "セマグルチド錠とグリメピリド錠の併用禁忌"
      },
      {
        "key": 5,
        "text": "セマグルチド錠とダパグリフロジン錠の併用禁忌"
      }
    ],
    "correct_answer": 2,
    "explanation": "セマグルチド（遺伝子組換え）錠の用法及び用量、用法及び用量に関連する注意を下記に示す。\n\n【用法及び用量】\n\n通常、成人には、セマグルチド（遺伝子組換え）として1日1回7mgを維持用量とし経口投与する。ただし、1日1回3mgから開始し、4週間以上投与した後、1日1回7mgに増量する。なお、患者の状態に応じて適宜増減するが、1日1回7mgを4週間以上投与しても効果不十分な場合には、1日1回14mgに増量することができる。\n\n【用法及び用量に関連する注意】\n\n本剤の吸収は胃の内容物により低下することから、本剤は、1日のうちの最初の食事又は飲水の前に、空腹の状態でコップ約半分の水（約120mL以下）とともに3mg錠、7mg錠又は14mg錠を1錠服用すること。また、服用時及び服用後少なくとも30分は、飲食及び他の薬剤の経口摂取を避けること。分割・粉砕及びかみ砕いて服用してはならない。\n本剤14mgを投与する際には、本剤の7mg錠を2錠投与することは避けること。\n投与を忘れた場合はその日は投与せず、翌日投与すること。",
    "tags": []
  },
  {
    "id": "r110-263",
    "year": 110,
    "question_number": 263,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 262−263       ₆₅ 歳男性。 ₂ 型糖尿病のため処方 ₁ ～ ₃ にて治療していた。\n（処方 ₁ ）\nメトホルミン塩酸塩錠 ₂₅₀ mg         ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\n₁日₃回    朝昼夕食後       ₂₈ 日分\n（処方 ₂ ）\nグリメピリド錠 ₁ mg              ₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回    朝夕食後     ₂₈ 日分\n（処方 ₃ ）\nシタグリプチンリン酸塩錠 ₅₀ mg        ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nダパグリフロジン錠 ₅ mg            ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nエナラプリルマレイン酸塩錠 ₅ mg        ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₂₈ 日分\n最近、血糖コントロールが不良であることから、今回、処方 ₃ が処方 ₄ へ変更と\nなり、処方 ₁ 、 ₂ 及び ₄ が記載された処方箋を持ってかかりつけ薬局を訪れた。\n（処方 ₄ ）\nセマグルチド（遺伝子組換え）錠 ₇ mg      ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nダパグリフロジン錠 ₅ mg            ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nエナラプリルマレイン酸塩錠 ₅ mg        ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₂₈ 日分\n問 263（薬理）\n処方 ₁ ～ ₄ のいずれかの薬物の作用機序として、正しいのはどれか。2つ選べ。\n1     グルカゴン様ペプチド︲₁（GLP︲₁）受容体を刺激して、膵臓からのインスリン\n及びグルカゴン分泌を促進する。\n2 ジペプチジルペプチダーゼ︲₄（DPP︲₄）を阻害して、小腸から分泌されるイン\nクレチンの分解を抑制する。\n3     アンジオテンシン変換酵素（ACE）を阻害して、血中でのアンジオテンシンⅠ\nの生成を抑制する。\n4     ミトコンドリア呼吸鎖複合体Ⅰを阻害して、血糖値依存的なインスリン分泌を\n促進する。\n5     AMP 活性化プロテインキナーゼ（AMPK）を活性化して、肝臓での糖新生を\n抑制する。",
    "choices": [
      {
        "key": 1,
        "text": "グルカゴン様ペプチド︲₁（GLP︲₁）受容体を刺激して、膵臓からのインスリン 及びグルカゴン分泌を促進する。"
      },
      {
        "key": 2,
        "text": "アンジオテンシン変換酵素（ACE）を阻害して、血中でのアンジオテンシンⅠ の生成を抑制する。"
      },
      {
        "key": 3,
        "text": "ミトコンドリア呼吸鎖複合体Ⅰを阻害して、血糖値依存的なインスリン分泌を 促進する。"
      },
      {
        "key": 4,
        "text": "AMP 活性化プロテインキナーゼ（AMPK）を活性化して、肝臓での糖新生を 抑制する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q263.png"
  },
  {
    "id": "r110-264",
    "year": 110,
    "question_number": 264,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "62歳女性。最近2週間ほど、咳嗽・喀痰があり、微熱も続いていた。市販薬を継続服用していたが改善せず、呼吸器内科を受診したところ、肺結核と診断された。処方は以下のとおりである。\n問264（実務）\n\n　この患者に説明する内容として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "しっかりと服薬遵守すれば、今回処方された分の薬で治療が終了すること。"
      },
      {
        "key": 2,
        "text": "リファンピシンの服用により、尿や便が橙赤色等に着色する可能性があること。"
      },
      {
        "key": 3,
        "text": "イソニアジドの副作用として高尿酸血症があること。"
      },
      {
        "key": 4,
        "text": "ピラジナミドは、チーズなどのチラミンを多く含む食品との相互作用により、動悸が現れること。"
      },
      {
        "key": 5,
        "text": "エタンブトールの副作用として視力障害があること。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n結核の治療期間は、「初期治療（2ヶ月間）」と「継続治療（4ヶ月間）」に分かれており、標準的に6ヶ月間行われる。一般に、初期治療では、リファンピシン＋イソニアジド＋ピラジナミド＋エタンブトールが用いられ、その後、継続治療では、リファンピシン＋イソニアジドが用いられる。今回の処方内容から初期治療であると判断でき、今後も薬物療法を継続する必要がある。\n\n２　正\n\nリファンピシンは、体液（尿、便、汗、涙など）を赤褐色に着色させる。\n\n３　誤\n\nイソニアジドは、副作用として、高尿酸血症を起こすとの報告はない。なお、ピラジナミドは、副作用として、高尿酸血症を引き起こすことがある。\n\n４　誤\n\nピラジナミドは、チーズなどのチラミンを多く含む食品との相互作用を起こすとの報告はない。なお、チーズなどのチラミンを多く含む食品との相互作用を起こすのは、イソニアジドである。イソニアジドのMAO阻害作用により、チラミンは不活化されず、アドレナリン作動性神経終末部において蓄積されているカテコールアミンの遊離を促進することで動悸が現れることがある。\n\n５　正\n\nエタンブトールは、重大な副作用として、視神経",
    "tags": []
  },
  {
    "id": "r110-265",
    "year": 110,
    "question_number": 265,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 264−265      ₆₂ 歳女性。最近 ₂ 週間ほど、咳嗽・喀痰があり、微熱も続いていた。市販\n薬を継続服用していたが改善せず、呼吸器内科を受診したところ、肺結核と診断さ\nれた。処方は以下のとおりである。\n（処方 ₁ ）\nリファンピシンカプセル ₁₅₀ mg    ₁ 回 ₃ カプセル（ ₁ 日 ₃ カプセル）\n₁日₁回       朝食前      ₃₀ 日分\n（処方 ₂ ）\nイソニアジド錠 ₁₀₀ mg        ₁ 回 ₂ 錠（ ₁ 日 ₂ 錠）\nピラジナミド原末              ₁ 回 ₁ . ₅ g（ ₁ 日 ₁ . ₅ g）\nエタンブトール塩酸塩錠 ₂₅₀ mg    ₁ 回 ₃ 錠（ ₁ 日 ₃ 錠）\n₁日₁回       朝食後      ₃₀ 日分\n問 265（薬理）\n処方 ₁ 及び処方 ₂ のいずれかの薬物の結核菌に対する作用として、正しいのはど\nれか。2つ選べ。\n1     DNA 依存性 RNA ポリメラーゼを阻害して、RNA 合成を抑制する。\n2     ミコール酸の合成を阻害して、細胞壁合成を抑制する。\n3     トポイソメラーゼⅣと DNA ジャイレースを阻害して、核酸合成を抑制する。\n4     ATP 合成酵素を阻害して、結核菌細胞内の ATP 量を低下させる。\n5     リボソーム ₃₀S サブユニットに作用して、タンパク質合成を阻害する。",
    "choices": [
      {
        "key": 1,
        "text": "DNA 依存性 RNA ポリメラーゼを阻害して、RNA 合成を抑制する。"
      },
      {
        "key": 2,
        "text": "ミコール酸の合成を阻害して、細胞壁合成を抑制する。"
      },
      {
        "key": 3,
        "text": "トポイソメラーゼⅣと DNA ジャイレースを阻害して、核酸合成を抑制する。"
      },
      {
        "key": 4,
        "text": "ATP 合成酵素を阻害して、結核菌細胞内の ATP 量を低下させる。"
      },
      {
        "key": 5,
        "text": "リボソーム ₃₀S サブユニットに作用して、タンパク質合成を阻害する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q265.png"
  },
  {
    "id": "r110-266",
    "year": 110,
    "question_number": 266,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 266−267       ₄₅ 歳男性。喫煙歴 ₂₀ 年（ ₁ 日 ₂₀～₃₀ 本程度）。男性は、最近、痰が絡ん\nで咳込みが多く、健康のために禁煙を希望し、薬局を訪れた。薬剤師は、禁煙サ\nポートのため男性の生活習慣及び健康状態を聞き取り、ニコチンガム製剤による禁\n煙を勧めることにした。男性と話し合いのうえ、禁煙期間の目標を ₉₀ 日に設定\nし、最初の ₁ 週間は ₁ 日の使用個数の目安を以下とした。\n（販売する一般用医薬品）\nニコチンガム製剤（ニコチン ₂ mg 含有／個）\n（使用個数の目安）\n₁日₉個\nまた、男性に対して習慣的に摂取している飲食物を質問したところ、以下の情報\nが得られた。\n・炭酸水（ａ）を頻繁に飲用している。\n・亜鉛含有サプリメント（ｂ）を食後に摂取している。\n・気分を落ち着かせるために、セントジョーンズワート含有食品（ｃ）を毎日摂取\nしている。\n問 266（薬剤）\nニコチンガム製剤による禁煙補助療法の十分な効果を得るために、摂取を控える\n必要がある飲食物とその理由の組合せとして正しいのはどれか。1つ選べ。\n飲食物                     理由\n1      a    口腔内において製剤からのニコチンの溶出が低下するため。\n2      a    口腔内が酸性に傾くことによりニコチンの吸収が低下するため。\n3     b     胃内 pH の上昇によりニコチンの吸収が低下するため。\n4     b     消化管においてキレート形成によりニコチンの吸収が低下するため。\n小腸における CYP₃A₄ の誘導によりニコチンの代謝が促進される\n5      c\nため。\n小腸における P︲糖タンパク質の誘導によりニコチンの消化管分泌\n6      c\nが促進されるため。",
    "choices": [
      {
        "key": 1,
        "text": "a    口腔内において製剤からのニコチンの溶出が低下するため。"
      },
      {
        "key": 2,
        "text": "a    口腔内が酸性に傾くことによりニコチンの吸収が低下するため。"
      },
      {
        "key": 3,
        "text": "b     胃内 pH の上昇によりニコチンの吸収が低下するため。"
      },
      {
        "key": 4,
        "text": "b     消化管においてキレート形成によりニコチンの吸収が低下するため。 小腸における CYP₃A₄ の誘導によりニコチンの代謝が促進される"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q266.png"
  },
  {
    "id": "r110-267",
    "year": 110,
    "question_number": 267,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 266−267       ₄₅ 歳男性。喫煙歴 ₂₀ 年（ ₁ 日 ₂₀～₃₀ 本程度）。男性は、最近、痰が絡ん\nで咳込みが多く、健康のために禁煙を希望し、薬局を訪れた。薬剤師は、禁煙サ\nポートのため男性の生活習慣及び健康状態を聞き取り、ニコチンガム製剤による禁\n煙を勧めることにした。男性と話し合いのうえ、禁煙期間の目標を ₉₀ 日に設定\nし、最初の ₁ 週間は ₁ 日の使用個数の目安を以下とした。\n（販売する一般用医薬品）\nニコチンガム製剤（ニコチン ₂ mg 含有／個）\n（使用個数の目安）\n₁日₉個\nまた、男性に対して習慣的に摂取している飲食物を質問したところ、以下の情報\nが得られた。\n・炭酸水（ａ）を頻繁に飲用している。\n・亜鉛含有サプリメント（ｂ）を食後に摂取している。\n・気分を落ち着かせるために、セントジョーンズワート含有食品（ｃ）を毎日摂取\nしている。\n問 267（実務）\n薬剤師は、禁煙補助療法導入時のニコチンガム製剤の使用方法及び使用上の注意\nを説明することにした。薬剤師が説明する内容として、適切なのはどれか。2つ選\nべ。\n1     ピリッとした味を感じるまでゆっくりと噛んだ後、頬と歯茎の間に置く。\n2     喫煙の欲求がなくても定期的に使用する。\n3     治療開始時は、喫煙との併用が可能である。\n4 使用中に唾液が多くなった場合は、唾液を飲み込まず、ティッシュペーパーな\nどに唾液を出す。\n5     使用後のガムは、医療廃棄物として薬局で回収する。",
    "choices": [
      {
        "key": 1,
        "text": "ピリッとした味を感じるまでゆっくりと噛んだ後、頬と歯茎の間に置く。"
      },
      {
        "key": 2,
        "text": "喫煙の欲求がなくても定期的に使用する。"
      },
      {
        "key": 3,
        "text": "治療開始時は、喫煙との併用が可能である。"
      },
      {
        "key": 4,
        "text": "使用後のガムは、医療廃棄物として薬局で回収する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q267.png"
  },
  {
    "id": "r110-268",
    "year": 110,
    "question_number": 268,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "68歳女性。身長155cm、体重50kg。下腿浮腫及び尿の泡立ちを自覚するようになり、近医を受診した。タンパク尿及び低アルブミン血症を認め、ネフローゼ症候群が疑われ、精査加療のため総合病院に入院となった。検査の結果、以下の治療を開始した。\n1週間後、浮腫の軽減が不十分であったため、多職種によるカンファレンスで薬剤師に意見が求められた。\n問268（実務）\n\n薬剤師がカンファレンスで提案する内容として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ヒドロクロロチアジドの追加"
      },
      {
        "key": 2,
        "text": "プレドニゾロンの中止"
      },
      {
        "key": 3,
        "text": "フロセミドの増量"
      },
      {
        "key": 4,
        "text": "カルペリチドの追加"
      },
      {
        "key": 5,
        "text": "ピタバスタチンの減量"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nネフローゼ症候群による浮腫は、しばしば強い利尿薬抵抗性を示すことがある。フロセミド単剤で十分な効果が得られない場合、チアジド系利尿薬の併用は有効とされており、ヒドロクロロチアジドの追加は浮腫軽減を目的とした適切な対応といえる。\n\n２　誤\n\nプレドニゾロンは、ネフローゼ症候群の第一選択薬である。本症例では、尿中タンパク（3＋）とネフローゼ症候群による症状があることから、プレドニゾロンの投与を中止することは不適切である。\n\n３　正\n\n浮腫のコントロールが不十分であるため、ループ利尿薬の増量は標準的な対応である。尿量や電解質バランスに注意しつつ、段階的に増量して反応を見ることが推奨されている。\n\n４　誤\n\nカルペリチドは急性心不全における静注治療薬であり、ネフローゼ症候群の慢性浮腫への使用は適応外である。したがって、この症例でのカルペリチドの投与は不適切である。\n\n５　誤\n\nネフローゼ症候群では、LDL-Cが著しく上昇しやすく、動脈硬化リスクも高い。LDL-C 248mg/dLは治療対象であり、ピタバスタチンを減量するのではなく維持または増量を検討する必要がある。",
    "tags": []
  },
  {
    "id": "r110-269",
    "year": 110,
    "question_number": 269,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 268−269      ₆₈ 歳女性。身長 ₁₅₅ cm、体重 ₅₀ kg。下腿浮腫及び尿の泡立ちを自覚する\nようになり、近医を受診した。タンパク尿及び低アルブミン血症を認め、ネフロー\nゼ症候群が疑われ、精査加療のため総合病院に入院となった。検査の結果、以下の\n治療を開始した。\n（入院時検査値）\n血圧 ₁₄₂/₉₂ mmHg、血清総タンパク ₅ . ₁ g/dL、血清アルブミン ₂ . ₆ g/dL、\nBUN ₃₈ mg/dL、血清クレアチニン ₁ . ₀ mg/dL、総コレステロール ₃₃₈ mg/dL、\nLDL︲C ₂₄₈ mg/dL、Na ₁₄₂ mEq/L、K ₄ . ₂ mEq/L、尿タンパク（ ₃+）\n（処方 ₁ ）\nプレドニゾロン錠 ₅ mg        ₁ 回 ₈ 錠（ ₁ 日 ₈ 錠）\nフロセミド錠 ₄₀ mg         ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₇ 日分\n（処方 ₂ ）\nピタバスタチン Ca 錠 ₂ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    夕食後    ₇ 日分\n₁ 週間後、浮腫の軽減が不十分であったため、多職種によるカンファレンスで薬\n剤師に意見が求められた。\n問 269（薬剤）\n治療開始後、ステロイド抵抗性との診断を受け、シクロスポリンカプセルが追加\nされることになった。そのため、薬剤師は処方 ₂ の薬剤についてフルバスタチンへ\nの変更を医師に提案した。その理由として正しいのはどれか。1つ選べ。\n1     シクロスポリンがピタバスタチンの消化管吸収を阻害するため。\n2     シクロスポリンがピタバスタチンの肝取り込みを阻害するため。\n3     ピタバスタチンがシクロスポリンの代謝を阻害するため。\n4     ピタバスタチンがシクロスポリンの尿細管分泌を阻害するため。\n5     シクロスポリンがピタバスタチンの尿細管再吸収を阻害するため。",
    "choices": [
      {
        "key": 1,
        "text": "シクロスポリンがピタバスタチンの消化管吸収を阻害するため。"
      },
      {
        "key": 2,
        "text": "シクロスポリンがピタバスタチンの肝取り込みを阻害するため。"
      },
      {
        "key": 3,
        "text": "ピタバスタチンがシクロスポリンの代謝を阻害するため。"
      },
      {
        "key": 4,
        "text": "ピタバスタチンがシクロスポリンの尿細管分泌を阻害するため。"
      },
      {
        "key": 5,
        "text": "シクロスポリンがピタバスタチンの尿細管再吸収を阻害するため。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q269.png"
  },
  {
    "id": "r110-270",
    "year": 110,
    "question_number": 270,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "69歳男性。数日前より髪の毛が抜けやすくなり、ふけや頭皮のかゆみを自覚した。皮膚科を受診したところ、頭部白癬と診断され、経口抗真菌薬で治療することになった。男性は以下の処方箋を持って、薬局を訪れた。男性の持参したお薬手帳を薬剤師が確認したところ、現在服用中の薬剤との薬物相互作用が懸念された。\n問270（薬剤）\n\nお薬手帳から確認された現在服用中の薬剤とイトラコナゾールカプセルとの間で懸念される薬物相互作用の発現機序として、最も適切なのはどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "胃内pHの上昇による溶解性の低下"
      },
      {
        "key": 2,
        "text": "核内受容体を介した小腸P-糖タンパク質の発現量増加"
      },
      {
        "key": 3,
        "text": "肝臓のOATP1B1に対する競合阻害"
      },
      {
        "key": 4,
        "text": "代謝物によるCYP3A4の不可逆的阻害"
      },
      {
        "key": 5,
        "text": "ヘム鉄への配位結合によるCYP3A4の阻害"
      }
    ],
    "correct_answer": 5,
    "explanation": "シンバスタチンは主にCYP3A4によって代謝される。なお、イトラコナゾールはCYPの活性中心であるヘム鉄に配位結合することにより、CYP3A4の活性を可逆的に阻害する。この結果、シンバスタチンの代謝が大きく抑制され、血中濃度が上昇しやすくなる。そのため、横紋筋融解症などの重篤な副作用リスクが高まる。したがって、シンバスタチンとイトラコナゾールは併用禁忌である。",
    "tags": []
  },
  {
    "id": "r110-271",
    "year": 110,
    "question_number": 271,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 270−271      ₆₉ 歳男性。数日前より髪の毛が抜けやすくなり、ふけや頭皮のかゆみを自\n覚した。皮膚科を受診したところ、頭部白癬と診断され、経口抗真菌薬で治療する\nことになった。男性は以下の処方箋を持って、薬局を訪れた。男性の持参したお薬\n手帳を薬剤師が確認したところ、現在服用中の薬剤との薬物相互作用が懸念され\nた。\n（処方）\nイトラコナゾールカプセル ₅₀ mg        ₁ 回 ₂ カプセル（ ₁ 日 ₂ カプセル）\n₁日₁回    朝食直後    ₁₄ 日分\n（お薬手帳から確認された現在の服用薬）\nオルメサルタン口腔内崩壊錠 ₂₀ mg       ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nフェブキソスタット錠 ₂₀ mg          ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後\nビルダグリプチン錠 ₅₀ mg           ₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回    朝夕食後\nミグリトール口腔内崩壊錠 ₅₀ mg        ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\n₁日₃回    朝昼夕食直前\nシンバスタチン錠 ₅ mg             ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    夕食後\n問 271（実務）\n前問で懸念された薬物相互作用を回避するために、薬剤師が皮膚科の医師に提案\nする処方変更の内容として、適切なのはどれか。1つ選べ。\n1     投与量の減量\n2     投与タイミングの就寝前への変更\n3     テルビナフィン塩酸塩錠への変更\n4     イトラコナゾール内用液への変更\n5     ボリコナゾール錠への変更",
    "choices": [
      {
        "key": 1,
        "text": "投与量の減量"
      },
      {
        "key": 2,
        "text": "投与タイミングの就寝前への変更"
      },
      {
        "key": 3,
        "text": "テルビナフィン塩酸塩錠への変更"
      },
      {
        "key": 4,
        "text": "イトラコナゾール内用液への変更"
      },
      {
        "key": 5,
        "text": "ボリコナゾール錠への変更"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q271.png"
  },
  {
    "id": "r110-272",
    "year": 110,
    "question_number": 272,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "25歳女性。身長160cm、体重55kg。朝、自室から起床してこないため、心配に思った家族が部屋の中に入ったところ、ベッドの上で仰向けになって意識を失っていた。呼びかけに反応しなかったため、救急隊を要請した。病院搬送時の意識レベルはJapan Coma Scale（JCS）200、血圧100/55mmHg、脈拍105拍/分、呼吸15回/分、体温36.0°Cであった。採取した尿を用いて定性試験でバルビツール酸類が強陽性であった。家族からの情報によると、女性は以前よりてんかん治療のためフェノバルビタールを常用しており、たびたび体調を崩していた。胃内容物を分析したところ、フェノバルビタールが検出され、過量摂取による意識障害と診断された。\n問272（薬剤）\n\n薬剤師がフェノバルビタールの血清中濃度を測定したところ、65μg/mLであった。医師は、球形吸着炭の6時間ごとの繰り返し投与、及び炭酸水素ナトリウム注射液の持続投与を開始した。2日後、フェノバルビタールの血清中濃度は40μg/mLとなり、意識は徐々に回復した。フェノバルビタールの体内動態に及ぼす球形吸着炭及び炭酸水素ナトリウムの作用として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "血漿タンパク結合の阻害"
      },
      {
        "key": 2,
        "text": "肝取り込みの促進"
      },
      {
        "key": 3,
        "text": "腸肝循環の抑制"
      },
      {
        "key": 4,
        "text": "尿細管分泌の促進"
      },
      {
        "key": 5,
        "text": "尿細管再吸収の抑制"
      }
    ],
    "correct_answer": 3,
    "explanation": "フェノバルビタールの血清中濃度が65 µg/mLと治療域（10〜40 µg/mL）を大きく上回っており、JCS（Japan Coma Scale）200という重篤な意識障害もみられることから、フェノバルビタール中毒と考えられる。治療としては、呼吸管理に加えて、胃洗浄や球形吸着炭（活性炭）による消化管内残留薬物の除去、さらに炭酸水素ナトリウムを用いた尿アルカリ化による排泄促進が行われる。フェノバルビタールは腸肝循環により再吸収される薬剤であるため、胆汁に排泄された薬物が腸管から再吸収される。これを阻止する目的で、球形吸着炭を投与することで腸肝循環を遮断し、薬物の再吸収を抑制することができる。また、フェノバルビタールは弱酸性薬物であり、炭酸水素ナトリウムの投与により尿pHがアルカリ性に傾くと、非イオン型の割合が低下し、尿細管での再吸収が抑制される。結果として尿中排泄が促進され、血中濃度が低下する。",
    "tags": []
  },
  {
    "id": "r110-273",
    "year": 110,
    "question_number": 273,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 272−273    ₂₅ 歳女性。身長 ₁₆₀ cm、体重 ₅₅ kg。朝、自室から起床してこないため、\n心配に思った家族が部屋の中に入ったところ、ベッドの上で仰向けになって意識を\n失っていた。呼びかけに反応しなかったため、救急隊を要請した。病院搬送時の意\n識レベルは Japan Coma Scale（JCS）₂₀₀、血圧 ₁₀₀/₅₅ mmHg、脈拍 ₁₀₅ 拍/分、\n呼吸 ₁₅ 回/分、体温 ₃₆ . ₀ ℃であった。採取した尿を用いて定性試験でバルビツー\nル酸類が強陽性であった。家族からの情報によると、女性は以前よりてんかん治療\nのためフェノバルビタールを常用しており、たびたび体調を崩していた。胃内容物\nを分析したところ、フェノバルビタールが検出され、過量摂取による意識障害と診\n断された。\n問 273（実務）\n₃ 日後には、この患者の意識は完全に回復した。しかし、病棟薬剤師が患者の異\n変に気付き、医師とともに症状を確認したところ、一過性の退薬症状が出現したと\n考えられた。観察された症状として適切なのはどれか。2つ選べ。\n1     不安\n2     傾眠\n3     手指振戦\n4     発疹\n5     過度の心拍数低下",
    "choices": [
      {
        "key": 1,
        "text": "手指振戦"
      },
      {
        "key": 2,
        "text": "過度の心拍数低下"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q273.png"
  },
  {
    "id": "r110-274",
    "year": 110,
    "question_number": 274,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 274−275       ₆₅ 歳男性。高血圧症及び気管支ぜん息に対して処方 ₁ 及び処方 ₂ の薬剤を\n使用していた。\n（処方 ₁ ）\nパルミコート ₂₀₀ ng タービュヘイラー ₅₆ 吸入          ₁本\n（注）\n₁ 回 ₁ 吸入   ₁日₂回      朝夕   吸入\n（注：ブデソニド ₁ 回吸入量 ₂₀₀ ng のドライパウダー吸入式ステロイド薬）\n（処方 ₂ ）\nテルミサルタン錠 ₄₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nエプレレノン錠 ₅₀ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回     朝食後   ₂₈ 日分\n血圧が ₁₆₀/₉₅ mmHg 前後で推移していたため、テルミサルタン錠を ₈₀ mg に\n増量した。数日後、患者はめまいや頭痛を自覚したため、再来院した。血圧を測定\nしたところ ₉₂/₆₆ mmHg と低値を示した。\n問 274（薬剤）\nテルミサルタン錠の添付文書には、本態性高血圧症の患者にテルミサルタン\n₂₀ mg、₄₀ mg 及び ₈₀ mg をカプセル剤もしくは溶液として単回経口投与したとき\nの薬物動態パラメータが示されており、₄₀ mg 以上の投与量で用量比以上の曝露の\n上昇がみられた旨の記載がある。テルミサルタンの投与量と血中濃度時間曲線下面\n積（AUC）の関係を示す図として、最も近いのはどれか。1つ選べ。\nただし、この薬物の AUC は剤形による影響を受けないものとする。\n1                                           2\n₂₄₀₀                                        ₂₄₀₀\nAUC（ng・h/mL）                                AUC（ng・h/mL）\n₂₀₀₀                                        ₂₀₀₀\n₁₆₀₀                                        ₁₆₀₀\n₁₂₀₀                                        ₁₂₀₀\n₈₀₀                                         ₈₀₀\n₄₀₀                                         ₄₀₀\n₀   ₂₀ ₄₀ ₆₀ ₈₀ ₁₀₀                         ₀   ₂₀ ₄₀ ₆₀ ₈₀ ₁₀₀\n投与量（mg）                                     投与量（mg）\n3                                           4\n₂₄₀₀                                        ₂₄₀₀\nAUC（ng・h/mL）                                AUC（ng・h/mL）\n₂₀₀₀                                        ₂₀₀₀\n₁₆₀₀                                        ₁₆₀₀\n₁₂₀₀                                        ₁₂₀₀\n₈₀₀                                         ₈₀₀\n₄₀₀                                         ₄₀₀\n₀   ₂₀ ₄₀ ₆₀ ₈₀ ₁₀₀                         ₀   ₂₀ ₄₀ ₆₀ ₈₀ ₁₀₀\n投与量（mg）                                     投与量（mg）\n₂₄₀₀\nAUC（ng・h/mL）\n₂₀₀₀\n₁₆₀₀\n₁₂₀₀\n₈₀₀\n₄₀₀\n₀   ₂₀ ₄₀ ₆₀ ₈₀ ₁₀₀\n投与量（mg）",
    "choices": [],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q274.png"
  },
  {
    "id": "r110-275",
    "year": 110,
    "question_number": 275,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 274−275       ₆₅ 歳男性。高血圧症及び気管支ぜん息に対して処方 ₁ 及び処方 ₂ の薬剤を\n使用していた。\n（処方 ₁ ）\nパルミコート ₂₀₀ ng タービュヘイラー ₅₆ 吸入          ₁本\n（注）\n₁ 回 ₁ 吸入   ₁日₂回      朝夕   吸入\n（注：ブデソニド ₁ 回吸入量 ₂₀₀ ng のドライパウダー吸入式ステロイド薬）\n（処方 ₂ ）\nテルミサルタン錠 ₄₀ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nエプレレノン錠 ₅₀ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回     朝食後   ₂₈ 日分\n血圧が ₁₆₀/₉₅ mmHg 前後で推移していたため、テルミサルタン錠を ₈₀ mg に\n増量した。数日後、患者はめまいや頭痛を自覚したため、再来院した。血圧を測定\nしたところ ₉₂/₆₆ mmHg と低値を示した。\n問 275（実務）\nテ ル ミ サ ル タ ン 錠 は ₄₀ mg に 減 量 さ れ 自 覚 症 状 は 消 失 し た が、 血 圧 が\n₁₆₀/₉₅ mmHg まで上昇した。そのため、他の降圧薬を追加することになった。追\n加する薬物として適切なのはどれか。2つ選べ。\n1      プロプラノロール塩酸塩\n2      トリクロルメチアジド\n3      ベラパミル塩酸塩\n4      スピロノラクトン\n5      アムロジピンベシル酸塩",
    "choices": [
      {
        "key": 1,
        "text": "プロプラノロール塩酸塩"
      },
      {
        "key": 2,
        "text": "トリクロルメチアジド"
      },
      {
        "key": 3,
        "text": "ベラパミル塩酸塩"
      },
      {
        "key": 4,
        "text": "スピロノラクトン"
      },
      {
        "key": 5,
        "text": "アムロジピンベシル酸塩"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q275.png"
  },
  {
    "id": "r110-276",
    "year": 110,
    "question_number": 276,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "68歳女性。15年前、乳がんにより右乳房の切除術を受けた。再発なく経過していたが、3年前に腰痛が出現し、骨転移、胸膜転移及び右胸水を認めたため、再発と診断された。オピオイドによる疼痛管理が開始され、1年前からは緩和医療に移行し、処方1及び処方2の薬剤を使用していた。\nその後、皮膚に対する副作用が強く出現したため、処方1の薬剤の貼付部位の変更や保湿を行ったが改善されず、処方1を処方3に変更した。\n問276（薬剤）\n\n処方1及び処方3の薬剤に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "処方1の薬剤は、定常状態で薬物を0次放出する。"
      },
      {
        "key": 2,
        "text": "処方1の薬剤の1枚当たりの有効成分含量は、フェンタニルに換算して2.55mgである。"
      },
      {
        "key": 3,
        "text": "処方1の薬剤からの有効成分の吸収量は、貼付部位の温度が上昇すると増大する。"
      },
      {
        "key": 4,
        "text": "処方3の薬剤は、シングルユニット型のリザーバー型製剤である。"
      },
      {
        "key": 5,
        "text": "処方3の薬剤は、初回分を処方1の薬剤の剥離直後に服用する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n処方1は、設問の図より薬物含有層の膏体が存在していることから、マトリックス型の経皮吸収型製剤であると判断できる。マトリックス型製剤は、薬物放出後もマトリックスの形態が変化しないことから時間の経過に伴って、放出境界面が製剤内部に移行し、薬物の拡散距離が長くなり、時間と共に放出速度は低下するため、放出速度は一定ではない（0次放出しない）。\n\n２　正\n\n処方１の塩係数が1.57であるため、フェンタニルに換算すると4mg÷1.57≒2.55mgとなる。塩係数1.57とは、フェンタニルとフェンタニルクエン酸塩の質量比が1：1.57の関係にあることを示す。\n\n３　正\n\n処方1の吸収量は、温度、血流量、皮膚の状況、皮下脂肪量に影響を受けるため、貼付部位の温度が上昇すると血液中への吸収量が増大する。よって、本剤貼付中は、外部熱源への接触、熱い温度での入浴等を避ける必要がある。\n\n４　誤\n\n処方３は、設問の図より添加物としてヒドロキシプロピルセルロールが用いられていることから、親水性マトリックス型徐放錠であると判断できる。なお、リザーバー型とは、エチルセルロースなどの皮膜で錠剤または顆粒剤を被",
    "tags": []
  },
  {
    "id": "r110-277",
    "year": 110,
    "question_number": 277,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 276−277       ₆₈ 歳女性。₁₅ 年前、乳がんにより右乳房の切除術を受けた。再発なく経\n過していたが、 ₃ 年前に腰痛が出現し、骨転移、胸膜転移及び右胸水を認めたた\nめ、再発と診断された。オピオイドによる疼痛管理が開始され、 ₁ 年前からは緩和\n医療に移行し、処方 ₁ 及び処方 ₂ の薬剤を使用していた。\n（処方 ₁ ）\nフェンタニルクエン酸塩テープ ₄ mg（ ₁ 日用）\n（注 1）\n₁ 回 ₁ 枚（ ₁ 日 ₁ 枚）\n₁日₁回      ₂₄ 時間毎    ₇ 日分\n（処方 ₂ ）\nモルヒネ塩酸塩水和物内用液 ₁₀ mg            ₁ 回 ₂ 包（₁₀ mg/包）\n疼痛時内服      ₁₀ 回分（全 ₂₀ 包）\nその後、皮膚に対する副作用が強く出現したため、処方 ₁ の薬剤の貼付部位の変\n更や保湿を行ったが改善されず、処方 ₁ を処方 ₃ に変更した。\n（処方 ₃ ）\nヒドロモルフォン塩酸塩徐放錠 ₂₄ mg           ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n（注 2）\n₁日₁回      朝食後   ₇ 日分\n注₁   製剤の断面図と有効成分の構造式及び物性\n・フェンタニルクエン酸塩テープ（断面図）\n膏体（薬物含有層）                             支持体\nライナー\n・フェンタニルクエン酸塩の化学構造及び性状\n分子量：₅₂₈ . ₅₉（塩係数：₁ . ₅₇）\n構造式：\nHO CO₂H\nN                  ・HO₂C         CO₂H\nCH₃\nN         O\n性   状：白色の結晶又は結晶性の粉末である。メタノール又は酢\n酸（₁₀₀）に溶けやすく、水又はエタノール（₉₅）にや\nや溶けにくく、ジエチルエーテルに極めて溶けにくい。\n注₂   ヒドロモルフォン塩酸塩徐放錠 ₂₄ mg の組成及び性状\n・有効成分： ₁ 錠中ヒドロモルフォン塩酸塩 ₂₇ . ₁ mg（ヒドロモルフォン\nとして ₂₄ mg）\n・添加物：D︲マンニトール、ヒドロキシプロピルセルロース、\nヒプロメロース酢酸エステルコハク酸エステル、\nフマル酸ステアリルナトリウム\n・剤形：素錠（徐放錠）\n問 277（実務）\n処方 ₃ の薬剤に変更後、持続痛は適切に管理されていた。しかし、 ₆ ケ月を過ぎ\nた頃、突出痛に対する処方 ₂ の薬剤の効果が不十分となった。医師は、処方 ₂ の薬\n剤の投与量を増量したが、服用後に不快な眠気が続くようになったため、処方 ₂ を\n処方 ₄ に変更した。\n（処方 ₄ ）\nフェンタニルクエン酸塩舌下錠 ₁₀₀ ng   ₁回₁錠\n疼痛時   舌下投与   ₁₀ 回分\n薬剤師が患者に伝える内容として、適切なのはどれか。2つ選べ。\n1     処方 ₂ の薬剤に比べ作用の発現が速いので、突出痛に対し迅速に対応できる。\n2     最小用量から開始し、 ₁ 回の最適量は、症状に応じて医師が段階的に調節す\nる。\n3     痛みが強いときは、錠剤を噛み砕いてから舌下におく。\n4 口の中が乾燥している場合は、口に水を含み、含んだ水で溶かすように使用す\nる。\n5     突出痛に加え、持続性疼痛が増強されたときにも使用する。",
    "choices": [
      {
        "key": 1,
        "text": "処方 ₂ の薬剤に比べ作用の発現が速いので、突出痛に対し迅速に対応できる。"
      },
      {
        "key": 2,
        "text": "最小用量から開始し、 ₁ 回の最適量は、症状に応じて医師が段階的に調節す る。"
      },
      {
        "key": 3,
        "text": "痛みが強いときは、錠剤を噛み砕いてから舌下におく。"
      },
      {
        "key": 4,
        "text": "突出痛に加え、持続性疼痛が増強されたときにも使用する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q277.png"
  },
  {
    "id": "r110-278",
    "year": 110,
    "question_number": 278,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "36歳女性。糖尿病の家族歴あり。妊娠のため、近隣の産婦人科クリニックを受診した。妊娠初期から定期的に血糖測定していたところ、血糖値の上昇傾向が見られ、食事療法を行っていた。妊娠24週時(妊娠中期)に実施した75gブドウ糖負荷試験で、空腹時血糖値98mg/dL、1時間値192mg/dL、2時間値180mg/dLであったため、紹介された総合病院に管理入院し、食事療法に加えて、血糖自己測定及びインスリン療法が導入された。\n問278（実務）\n\n　薬剤師が患者に提供する情報として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "妊娠中期以降はインスリン抵抗性が改善するので、投与量を漸減していく可能性が高い。"
      },
      {
        "key": 2,
        "text": "インスリン注射に不安があれば、処方2を経口血糖降下薬に置き換えるBOT療法（Basal　Supported OralTherapy）の導入が可能である。"
      },
      {
        "key": 3,
        "text": "出産後に血糖値が正常化しても、食事療法と運動療法の継続や定期的な検査が必要である。"
      },
      {
        "key": 4,
        "text": "妊娠中は1日に複数回の血糖自己測定により、厳格な血糖管理を行う。"
      },
      {
        "key": 5,
        "text": "出産直後は高血糖を起こしやすいので、経口血糖降下薬を追加する可能性がある。"
      }
    ],
    "correct_answer": 3,
    "explanation": "本症例は妊娠糖尿病の患者に対する薬剤師の情報提供に関する問題である。妊娠糖尿病は、妊娠中に初めて発症した耐糖能異常であり、母体や胎児の合併症リスクを減らすため厳格な血糖管理が求められる。妊娠中期以降は胎盤ホルモン（ヒト胎盤ラクトーゲンなど）によりインスリン抵抗性が増加するため、食事療法で血糖コントロールが困難な場合にはインスリン療法が第一選択となる。また、出産後は一時的に血糖値が正常化しても、将来的な2型糖尿病の発症リスクが高いため、長期的な生活習慣管理と定期的な検査が重要である。\n\n１　誤\n\n妊娠中期〜後期は胎盤ホルモン（ヒト胎盤ラクトーゲン）の分泌が増加し、インスリン抵抗性は増強する。これに伴い必要インスリン量が増加する。\n\n２　誤\n\n妊娠糖尿病の薬物療法では、安全性の観点からインスリンが第一選択であり、経口血糖降下薬を用いることはない。よって、BOT療法（基礎インスリン製剤＋経口血糖降下薬）は妊婦に用いられない。\n\n３　正\n\n妊娠糖尿病では、出産後一時的に耐糖能が正常化することが多いが、将来的に2型糖尿病に移行するリスクが高いため、生活習慣を継続的に改善する必要がある。\n\n４　正",
    "tags": []
  },
  {
    "id": "r110-279",
    "year": 110,
    "question_number": 279,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 278−279       ₃₆ 歳女性。糖尿病の家族歴あり。妊娠のため、近隣の産婦人科クリニック\nを受診した。妊娠初期から定期的に血糖測定していたところ、血糖値の上昇傾向が\n見られ、食事療法を行っていた。妊娠 ₂₄ 週時（妊娠中期）に実施した ₇₅ g ブドウ糖\n負荷試験で、空腹時血糖値 ₉₈ mg/dL、 ₁ 時間値 ₁₉₂ mg/dL、 ₂ 時間値 ₁₈₀ mg/dL\nであったため、紹介された総合病院に管理入院し、食事療法に加えて、血糖自己測\n定及びインスリン療法が導入された。\n（処方 ₁ ）\nインスリンデテミル（遺伝子組換え） ₃₀₀ 単位/₃ mL                   ₁筒\n₁ 回 ₃ 単位    ₁日₁回     就寝前     皮下注射（自己注射）\n（処方 ₂ ）\nインスリンアスパルト（遺伝子組換え） ₃₀₀ 単位/₃ mL                       ₁筒\n₁ 回 ₃ 単位    ₁日₃回     朝昼夕食直前       皮下注射（自己注射）\n（入院時検査値）\n白血球 ₈ , ₅₀₀/nL、Hb ₁₂ . ₀ g/dL、血小板 ₃₂ . ₀ # ₁₀4/nL、\n随時血糖 ₁₇₈ mg/dL、HbA₁c ₅ . ₇％\n問 279（薬剤）\n処方 ₁ の薬剤が持効性を示す機構として、正しいのはどれか。1つ選べ。\n1     インスリン分子を結晶化することで、溶解性を低下させた。\n2 投与後、皮下組織において、インスリン分子が安定した可溶性のマルチヘキサ\nマーを形成するようにした。\n3     インスリン分子の等電点を改変することで、生理的な pH で微細な沈殿物を形\n成するようにした。\n4 インスリン分子に脂肪酸を結合させることで、血中でアルブミンと複合体を形\n成するようにした。\n5 インスリン分子をプロタミン硫酸塩との複合体とすることで、溶解速度を低下\nさせた。",
    "choices": [
      {
        "key": 1,
        "text": "インスリン分子を結晶化することで、溶解性を低下させた。"
      },
      {
        "key": 2,
        "text": "インスリン分子の等電点を改変することで、生理的な pH で微細な沈殿物を形 成するようにした。"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q279.png"
  },
  {
    "id": "r110-280",
    "year": 110,
    "question_number": 280,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "65歳男性。身長165cm、体重60kg。腹痛及び背部痛を訴え、近医を受診した。血中膵酵素及び腫瘍マーカー（CA19-9、CEA）が高値であったため、超音波内視鏡検査を施行したところ、膵臓がんと診断された。治癒切除が不能と判断され、胆道ドレナージが施行された。その後、化学療法としてGnP療法（ゲムシタビン・nab-パクリタキセル併用療法）で治療を行うことになった。\n問280（実務）\n\n処方1の薬剤による治療に関して、薬剤師が医療スタッフに伝える注意事項として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "投与前に好中球数及び血小板数が減少していないかを確認する。"
      },
      {
        "key": 2,
        "text": "ヒト由来成分に対する過敏症予防のための前投与が実施されたかを確認する。"
      },
      {
        "key": 3,
        "text": "投与時に血管痛が出た場合は、次回から懸濁に用いる液をブドウ糖液に変更する。"
      },
      {
        "key": 4,
        "text": "インラインフィルターを使用して投与することを確認する。"
      },
      {
        "key": 5,
        "text": "感染症伝播のリスクについての説明を患者に行ったかを確認する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "GnP療法（ゲムシタビン＋nab-パクリタキセル併用療法）は、切除不能膵がんに推奨される治療法である。成人では、アブラキサン®点滴静注用（パクリタキセル製剤）125 mg/m²を1日1回30分かけて投与し、その後ゲムシタビン1,000 mg/m²を同様に投与する。これを週1回3週連続で行い、1週休薬を1コースとする。\n\n１　正\n\nアブラキサン®（以下：本剤）は、骨髄抑制を起こしやすく、好中球減少による感染症、血小板減少による出血リスクを高める。そのため、投与前に好中球、血小板が減少していないか確認する必要がある。\n\n２　誤\n\n本剤を投与する前にヒト由来成分に対する過敏症予防のための前投与を行う必要はない。なお、タキソール®注射液（パクリタキセル製剤）は、ポリオキシエチレンヒマシ油やエタノール等を含有しており、過敏症を起こすことがあるため、前投与（ステロイド、抗ヒスタミン剤など）を行う必要がある。\n\n３　誤\n\n本剤は、生理食塩水に懸濁して用いる製剤であり、懸濁にブドウ糖液を用いることはない。\n\n４　誤\n\n本剤にはアルブミンが含まれており、インラインフィルターを使用して投与すると、目詰まり",
    "tags": []
  },
  {
    "id": "r110-281",
    "year": 110,
    "question_number": 281,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 280−281    ₆₅ 歳男性。身長 ₁₆₅ cm、体重 ₆₀ kg。腹痛及び背部痛を訴え、近医を受診\nした。血中膵酵素及び腫瘍マーカー（CA₁₉︲₉、CEA）が高値であったため、超音\n波内視鏡検査を施行したところ、膵臓がんと診断された。治癒切除が不能と判断さ\nれ、胆道ドレナージが施行された。その後、化学療法として GnP 療法（ゲムシタ\nビン・nab︲パクリタキセル併用療法）で治療を行うことになった。\nレジメン（GnP）\n点滴\n薬剤                    用量           Day ₁   Day ₈   Day ₁₅ Day ₂₂\n時間\n（処方 ₁ ）              ₃₀ 分      ₁₂₅            ○       ○       ○\nアブラキサン点滴静注用                   mg/m\n（注）                       2\n生理食塩液で懸濁\n（処方 ₂ ）              ₃₀ 分      ₁ , ₀₀₀        ○       ○       ○\nゲムシタビン点滴静注用                   mg/m\n生理食塩液で溶解\n休薬                                                                   ○\n（注：パクリタキセル注射剤（アルブミン懸濁型））\n問 281（薬剤）\n処方 ₁ の薬剤に関する記述として、正しいのはどれか。1つ選べ。\n1 有効成分とアルブミンを可逆的に結合することによって、血中で速やかに崩壊\nするナノ粒子とした。\n2 腫瘍組織への集積性を高めるために、有効成分を生分解性高分子でマイクロカ\nプセル化した。\n3     有効成分とアルブミンを共有結合することによって、血中滞留性を改善した。\n4     アルコールと界面活性剤の添加によって、有効成分の溶解性を改善した。\n5 アルブミンの添加により膠質浸透圧を調整することで、副作用である血管痛を\n軽減した。",
    "choices": [
      {
        "key": 1,
        "text": "有効成分とアルブミンを共有結合することによって、血中滞留性を改善した。"
      },
      {
        "key": 2,
        "text": "アルコールと界面活性剤の添加によって、有効成分の溶解性を改善した。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q281.png"
  },
  {
    "id": "r110-282",
    "year": 110,
    "question_number": 282,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "65歳男性。帯状疱疹の予防のためにワクチン接種を希望した。男性は、かかりつけの病院で接種可能かを確認し、接種の予約を行った。接種の当日は平熱で、問診の結果からワクチン接種が可能と判定され、以下のワクチン製剤の1回目の接種を行うことになった。\n注：乾燥組換え帯状疱疹ワクチン。水痘帯状疱疹ウイルス糖タンパク質E抗原を有効成分とする凍結乾燥製剤と専用溶解用液からなる。前者は、添加物として精製白糖及びポリソルベート80等を含有する。後者は、グラム陰性菌Salmonella minnesota R595株のリポ多糖の非毒性型誘導体である3-脱アシル化-4′-モノホスホリルリピッドAと精製キラヤサポニンを包含するリポソームからなるアジュバントを含有する。\n問282（薬剤）\n\nこのワクチン製剤に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "専用溶解用液中の脂質粒子は、内水層を有する。"
      },
      {
        "key": 2,
        "text": "ポリソルベート80は、微生物の発育を阻止する目的で添加されている。"
      },
      {
        "key": 3,
        "text": "精製白糖は、無痛化を目的に添加されている。"
      },
      {
        "key": 4,
        "text": "凍結を避けて、2~8°Cで保存する。"
      },
      {
        "key": 5,
        "text": "血液中に移行後、製剤が徐々に分解されて有効成分を放出する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n溶解用液には脂質粒子（リポソームと呼ばれる閉鎖小胞）が含まれ、内部には水層を有する。\n\n２　誤\n\nポリソルベート80は、抗原製剤（凍結乾燥粉末）側に含まれており、溶解時に主薬を均一に分散させる溶解補助剤として添加されている。\n\n３　誤\n\n精製白糖は、賦形剤として添加されていることに加え、凍結乾燥製剤中で水分量を調整する安定剤として添加されている。\n\n４　正\n\nシングリックスは、2〜8℃で冷蔵保存し、凍結を避ける必要がある。また、調整後はすぐに使用する。また、すぐに使用できない場合は、遮光して2〜8℃で保管し、6時間以上経過したものは破棄する必要がある。\n\n５　誤\n\nリポソームは投与後、血液に移行する前に分解され免疫賦活剤（MPL、QS-21）を放出する。",
    "tags": []
  },
  {
    "id": "r110-283",
    "year": 110,
    "question_number": 283,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 282−283      ₆₅ 歳男性。帯状疱疹の予防のためにワクチン接種を希望した。男性は、か\nかりつけの病院で接種可能かを確認し、接種の予約を行った。接種の当日は平熱\nで、問診の結果からワクチン接種が可能と判定され、以下のワクチン製剤の ₁ 回目\nの接種を行うことになった。\nシングリックス筋注用             ₁ バイアル（専用溶解用液 ₀ . ₅ mL ₁ 本添付）\n（注）\n₁ 回 ₀ . ₅ mL を筋肉内注射\n注：乾燥組換え帯状疱疹ワクチン。水痘帯状疱疹ウイルス糖タンパク質 E 抗原\nを有効成分とする凍結乾燥製剤と専用溶解用液からなる。前者は、添加物と\nして精製白糖及びポリソルベート ₈₀ 等を含有する。後者は、グラム陰性菌\nSalmonella minnesota R₅₉₅ 株のリポ多糖の非毒性型誘導体である ₃︲脱アシ\nル化︲₄' ︲モノホスホリルリピッド A と精製キラヤサポニンを包含するリポ\nソームからなるアジュバントを含有する。\n問 283（実務）\nワクチン接種後、被接種者が待合室に向かう途中で気分が悪いとその場に倒れこ\nんだ。その場に居合わせた薬剤師と看護師は、待機している医師に対応を要請し\nた。患者は呼びかけには反応するが、頻脈と蒼白が観察された。駆けつけた医師は\n被接種者の症状からアナフィラキシーを疑ったため、その場に居合わせた薬剤師と\n看護師とともにチームとして患者に対応した。\nこの患者に対する迅速な対応として、適切なのはどれか。2つ選べ。\n1     患者を仰臥位に保持\n2     アドレナリンの静脈内投与\n3     急速輸液に使用する等張電解質液の準備\n4     二相性反応予防に使用する抗ヒスタミン薬の準備\n5     胸骨圧迫と人工呼吸の実施",
    "choices": [
      {
        "key": 1,
        "text": "患者を仰臥位に保持"
      },
      {
        "key": 2,
        "text": "アドレナリンの静脈内投与"
      },
      {
        "key": 3,
        "text": "急速輸液に使用する等張電解質液の準備"
      },
      {
        "key": 4,
        "text": "二相性反応予防に使用する抗ヒスタミン薬の準備"
      },
      {
        "key": 5,
        "text": "胸骨圧迫と人工呼吸の実施"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q283.png"
  },
  {
    "id": "r110-284",
    "year": 110,
    "question_number": 284,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "82歳男性。夜中に咳込みが激しくなり、病院を受診したところ、気管支ぜん息と診断され、処方1の薬剤が処方された。薬剤師は吸入練習機を用いて吸入指導を行い、薬剤を交付した。しかし、数日後、家族が薬局に来局し、「処方1の薬剤を吸入するとむせるようになり、吸入が困難になった」と話した。薬剤師が処方医にこの情報を提供したところ、再診察を行い処方1を処方2に変更した。\n問284（薬剤）\n\n処方１と処方2の薬剤に関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "処方1と処方2の薬剤は、いずれも無菌試験法に適合する。"
      },
      {
        "key": 2,
        "text": "処方１と処方2の薬剤は、いずれも吸入剤の空気力学的粒度測定法に適合する。"
      },
      {
        "key": 3,
        "text": "処方１の薬剤に用いられている容器は、薬剤を含むエアゾール缶、定量バルブとアクチュエーター等から構成される。"
      },
      {
        "key": 4,
        "text": "処方2の薬剤は、吸入量が一定となるように調製された固体粒子のエアゾールとして吸入する。"
      },
      {
        "key": 5,
        "text": "処方2の薬剤には、耐圧性の密封容器が用いられる。"
      }
    ],
    "correct_answer": 2,
    "explanation": "処方1（アニュイティ）\n\nドライパウダー吸入器（DPI）を使用。薬剤は粉末で、患者自身の吸入力で薬剤を気道に届ける。吸入力が弱いと吸入困難になるため、高齢者や呼吸機能が低下した患者では不向きな場合がある。\n\n処方2（オルベスコ）\n\n加圧定量噴霧器（pMDI）を使用。薬剤はエアゾール状で、ガスの圧力により薬剤が噴霧されるため、弱い吸入力でも投与が可能。使用時には吸入と噴霧のタイミングを合わせる必要がある。\n\n１　誤\n\n無菌試験は、注射剤や点眼剤、眼軟膏剤に適用される。\n\n２　正\n\n吸入剤の空気力学的粒度測定法は、吸入剤から発生するエアゾール中の微粒子特性を評価する試験法であり、粒子径分布などの特性を確認する目的で、吸入粉末剤および吸入エアゾール剤に適用される。\n\n３　誤\n\n薬剤を含むエアゾール缶＋定量バルブ＋アクチュエーター等で構成されるのは、吸入エアゾール剤（処方２）である。\n\n４　誤\n\n吸入量が一定となるように調製された固体粒子のエアゾールを吸入することができるのは、吸入粉末剤（処方１）である。\n\n５　正\n\n吸入エアゾール剤は耐圧性の密封容器を用いることが規定されている。なお、吸入粉",
    "tags": []
  },
  {
    "id": "r110-286",
    "year": 110,
    "question_number": 286,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "67歳女性。既往歴及び服薬歴はない。大腿骨近位部骨折のため、1ヶ月間入院加療することになった。入院時の大腿骨骨密度は、若年成人平均値（YAM）の65%であり、血清カルシウム値9.6mg/dL、血清リン値3.5mg/dLであった。退院時に以下の治療薬が処方された。\n約1ヶ月後に同病院の診察前の薬剤師外来にて服薬について患者にインタビューしたところ、服用を大変面倒だと感じており、飲み忘れることが時々あるとのことであった。残薬を持参するよう患者に伝えたが、その後の外来受診でも持参しなかった。退院から約半年経過してようやく持参した薬剤を確認したところ、リセドロン酸ナトリウム錠は10錠、エルデカルシトール錠は50錠の残薬が認められた。\n問286（病態・薬物治療）\n\nこの患者の病態及び治療に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "原発性の骨粗しょう症と考えられる。"
      },
      {
        "key": 2,
        "text": "発症に、カルシウム不足による骨基質の石灰化障害が関与している。"
      },
      {
        "key": 3,
        "text": "入院前は、骨吸収が骨形成を上回った状態と考えられる。"
      },
      {
        "key": 4,
        "text": "処方薬はいずれも横臥状態での摂取が可能である。"
      },
      {
        "key": 5,
        "text": "エルデカルシトールは、リセドロン酸による低カルシウム血症を増強する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n本患者は、高齢女性であり、明らかな続発性骨粗鬆症の原因（内分泌疾患や薬剤性など）の記載がないため、加齢と閉経を要因とする原発性骨粗鬆症であると考えられる。\n\n２　誤\n\n骨粗鬆症は、石灰化障害ではなく、骨量減少が関与する。なお、石灰化障害が関与するのは骨軟化症などである。\n\n３　正\n\n本患者は、骨密度がYAM 65%、大腿骨骨折の既往があることから、骨吸収が亢進し、骨形成とのバランスが崩れていたと推察される。\n\n４　誤\n\nリセドロン酸は、ビスホスホネート系薬であり、食道潰瘍リスク回避のため、起床後・水で服用し、その後30分以上は横になることはできない。\n\n５　誤\n\nエルデカルシトール（活性型ビタミンD₃製剤）は、腸管からのCa吸収を促進するため、リセドロン酸による低Ca血症を予防する補助手段として用いられる。",
    "tags": []
  },
  {
    "id": "r110-287",
    "year": 110,
    "question_number": 287,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 286−287      ₆₇ 歳女性。既往歴及び服薬歴はない。大腿骨近位部骨折のため、 ₁ ケ月間\n入院加療することになった。入院時の大腿骨骨密度は、若年成人平均値（YAM）\nの ₆₅％であり、血清カルシウム値 ₉ . ₆ mg/dL、血清リン値 ₃ . ₅ mg/dL であった。\n退院時に以下の治療薬が処方された。\n（処方 ₁ ）\nリセドロン酸 Na 錠 ₁₇ . ₅ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    起床時    ₄ 日分（ ₁ 週間に一度）\n（処方 ₂ ）\nエルデカルシトール錠 ₀ . ₇₅ ng    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₂₈ 日分\n約 ₁ ケ月後に同病院の診察前の薬剤師外来にて服薬について患者にインタビュー\nしたところ、服用を大変面倒と感じており、飲み忘れることが時々あるとのことで\nあった。残薬を持参するよう患者に伝えたが、その後の外来受診でも持参しなかっ\nた。退院から約半年経過してようやく持参した薬剤を確認したところ、リセドロン\n酸ナトリウム錠は ₁₀ 錠、エルデカルシトール錠は ₅₀ 錠の残薬が認められた。\n問 287（実務）\n患者の服薬遵守状況が良好でなく、治療効果が十分得られていないことを医師に\n報告し、薬剤の変更などの提案を行うことになった。提案として適切なのはどれ\nか。2つ選べ。\n1    リセドロン酸ナトリウム錠をラロキシフェン塩酸塩錠に変更\n2    メナテトレノンカプセルの追加\n3    リセドロン酸ナトリウム錠を月 ₁ 回服用製剤に変更\n4    リセドロン酸ナトリウム錠からテリパラチド皮下注（ ₁ 日 ₁ 回）自己注射に変更\n5    リセドロン酸ナトリウム錠からデノスマブ皮下注（ ₆ ケ月 ₁ 回）に変更",
    "choices": [
      {
        "key": 1,
        "text": "リセドロン酸ナトリウム錠をラロキシフェン塩酸塩錠に変更"
      },
      {
        "key": 2,
        "text": "メナテトレノンカプセルの追加"
      },
      {
        "key": 3,
        "text": "リセドロン酸ナトリウム錠を月 ₁ 回服用製剤に変更"
      },
      {
        "key": 4,
        "text": "リセドロン酸ナトリウム錠からテリパラチド皮下注（ ₁ 日 ₁ 回）自己注射に変更"
      },
      {
        "key": 5,
        "text": "リセドロン酸ナトリウム錠からデノスマブ皮下注（ ₆ ケ月 ₁ 回）に変更"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q287.png"
  },
  {
    "id": "r110-288",
    "year": 110,
    "question_number": 288,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "65歳男性。 毎年2月から6月頃にかけて、鼻水、くしゃみ、鼻づまりの症 状に悩むため、 2月になり、 一般用医薬品購入のため、 来局した。 初めての来局 だったので、聞き取りを行い、以下の情報が得られた。\n問288 （病態・薬物治療）\n\nこの来局者の病態に関する記述として、 正しいのはどれか。 2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "鼻閉には、鼻粘膜における血管透過性の亢進が関与している。"
      },
      {
        "key": 2,
        "text": "免疫複合体が鼻粘膜に沈着して発症した。"
      },
      {
        "key": 3,
        "text": "鼻汁中の好酸球が減少している。"
      },
      {
        "key": 4,
        "text": "症状の原因を特定するには、 スクラッチテストが有用である。"
      },
      {
        "key": 5,
        "text": "通年性に、鼻粘膜の腫脹が認められる可能性が高い。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nアレルギー性鼻炎では、ヒスタミンやロイコトリエンの作用により鼻粘膜の血管拡張や透過性亢進が生じ、浮腫性の腫脹（鼻閉）をきたす。鼻閉はアレルギー症状の三大主徴（くしゃみ、鼻汁、鼻閉）の一つである。\n\n２　誤\n\n本症例はⅠ型アレルギー（即時型）であり、免疫複合体の沈着を伴うⅢ型アレルギーとは異なる。\n\n３　誤\n\nアレルギー性鼻炎では、鼻汁中に好酸球の増加が認められる。\n\n４　正\n\nスクラッチテストやプリックテストなどの皮膚テストは、アレルゲンの特定に有用である。\n\n５　誤\n\n症状は2〜6月に限局しており、通年性アレルギー性鼻炎ではなく、季節性アレルギー性鼻炎（花粉症）が疑われる。",
    "tags": []
  },
  {
    "id": "r110-289",
    "year": 110,
    "question_number": 289,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 288−289        ₆₅ 歳男性。毎年 ₂ 月から ₆ 月頃にかけて、鼻水、くしゃみ、鼻づまりの症\n状に悩むため、 ₂ 月になり、一般用医薬品購入のため、来局した。初めての来局\nだったので、聞き取りを行い、以下の情報が得られた。\n・出勤や訪問などの外出時に、くしゃみや鼻水がひどくなるが、その症状に対する\n薬は飲んだことがない。\n・数年前に市販の花粉症に対する内服薬を購入したことがあるが、品名は忘れた。\n・就寝時布団に入り暖まると、鼻づまりがひどくなり、寝つきが悪くなることが多\nい。\n・仕事で週に ₂ ～ ₃ 回、社用車を運転して取引先を訪問することがある。\n・泌尿器科クリニックで前立腺肥大症と診断され、治療を受けている。\n・頻尿と残尿感を改善する内服薬を ₁ 日 ₁ 回夕食後に服用している。ただし、薬剤\n名は不明である。\n問 289（実務）\n聞き取りの内容を踏まえて、この来局者に提案する一般用医薬品として最も適切\nなのはどれか。1つ選べ。\n成分              包装        用法・用量\n₁ 錠中                       ₆錠      ₁回₁錠\nエピナスチン塩酸塩 ₂₀ mg                    ₁ 日 ₁ 回服用\n₁ 錠中                       ₄₈ 錠    ₁回₁錠\nエピナスチン塩酸塩 ₂₀ mg                    ₁ 日 ₁ 回服用\n₂ 錠中                       ₁₈ 錠    ₁回₁錠\nクロルフェニラミンマレイン酸塩 ₁₂ mg、             ₁ 日 ₁ ～ ₂ 回服用\nフェニレフリン塩酸塩 ₁₂ mg、\nダツラエキス ₂₄ mg\n₂ カプセル中                  ₂₄ カプセル   ₁ 回 ₂ カプセル\n塩酸プソイドエフェドリン ₆₀ mg、                ₁ 日 ₂ 回服用\n4   マレイン酸カルビノキサミン ₆ mg、\nベラドンナ総アルカロイド ₀ . ₂ mg、\n無水カフェイン ₅₀ mg\n₂ カプセル中                  ₄₈ カプセル   ₁ 回 ₂ カプセル\n塩酸プソイドエフェドリン ₆₀ mg、                ₁ 日 ₂ 回服用\n5   マレイン酸カルビノキサミン ₆ mg、\nベラドンナ総アルカロイド ₀ . ₂ mg、\n無水カフェイン ₅₀ mg",
    "choices": [
      {
        "key": 1,
        "text": "マレイン酸カルビノキサミン ₆ mg、 ベラドンナ総アルカロイド ₀ . ₂ mg、 無水カフェイン ₅₀ mg ₂ カプセル中                  ₄₈ カプセル   ₁ 回 ₂ カプセル 塩酸プソイドエフェドリン ₆₀ mg、                ₁ 日 ₂ 回服用"
      },
      {
        "key": 2,
        "text": "マレイン酸カルビノキサミン ₆ mg、 ベラドンナ総アルカロイド ₀ . ₂ mg、 無水カフェイン ₅₀ mg"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q289.png"
  },
  {
    "id": "r110-290",
    "year": 110,
    "question_number": 290,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "65歳男性。2型糖尿病の既往があり処方1の薬剤を服用している。約15年前にC型肝炎ウイルス（HCV）感染症と診断され、インターフェロン治療を受けたがウイルスは陰性化しなかった。その後、C型慢性肝炎に対して処方2の薬剤を内服し経過観察中であったが、AST及びALTの軽度上昇が認められたため、直接作用型抗ウイルス薬（処方3）が追加された。\n問290（実務）\n\nこの患者に対する服薬指導として、誤っているのはどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "カナグリフロジンにより、口が渇いたり尿量が増えることがあります。"
      },
      {
        "key": 2,
        "text": "抗ウイルス薬を飲み忘れた場合は、翌日の夕食後まで服用しないでください。"
      },
      {
        "key": 3,
        "text": "抗ウイルス薬の併用により、低血糖が発現する可能性が高まるため、ふらつきなどの症状に注意してください。"
      },
      {
        "key": 4,
        "text": "抗ウイルス薬は、12週間飲み続ける必要があるので、継続して受診してください。"
      },
      {
        "key": 5,
        "text": "抗ウイルス薬により血圧が上昇する可能性がありますので、家庭でも血圧を測定してください。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　正しい\n\n　カナグリフロジンは、ナトリウム–グルコース共輸送体2（SGLT2）を阻害することで、尿中へのグルコースの排泄を促進し、血糖コントロールを改善するとともに浸透圧利尿作用を示すため、口渇や多尿などの副作用がみられることがある。\n\n２　誤っている\n\n　レジパスビル・ソホスブビル配合錠を飲み忘れた場合は、気づいた時点で1回分を服用する。ただし、次回の服用時間が近い場合は、服用せず次の服用時間に1回分服用する。2回分をまとめて服用してはならない。\n\n３　正しい\n\n　C型肝炎ウイルス治療薬の投与開始後に低血糖が起き、糖尿病治療薬の減量が必要となった例が報告されている。そのため、レジパスビル・ソホスブビル配合錠の併用により、低血糖が発現する可能性が高くなる。\n\n４　正しい\n\n　レジパスビル・ソホスブビル配合錠は、通常、成人には1日1回1錠を12週間経口投与する。\n\n５　正しい\n\n　レジパスビル・ソホスブビル配合錠では、血圧上昇などの重大な副作用が報告されているため、治療中は血圧の経過観察が必要である。",
    "tags": []
  },
  {
    "id": "r110-291",
    "year": 110,
    "question_number": 291,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 290−291        ₆₅ 歳男性。 ₂ 型糖尿病の既往があり処方 ₁ の薬剤を服用している。約 ₁₅\n年前に C 型肝炎ウイルス（HCV）感染症と診断され、インターフェロン治療を受\nけたがウイルスは陰性化しなかった。その後、C 型慢性肝炎に対して処方 ₂ の薬剤\nを内服し経過観察中であったが、AST 及び ALT の軽度上昇が認められたため、\n直接作用型抗ウイルス薬（処方 ₃ ）が追加された。\n（処方 ₁ ）\nカナグリフロジン錠 ₁₀₀ mg        ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nテネリグリプチン錠 ₂₀ mg         ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₂₈ 日分\n（処方 ₂ ）\nウルソデオキシコール酸錠 ₁₀₀ mg     ₁ 回 ₂ 錠（ ₁ 日 ₆ 錠）\n₁日₃回    朝昼夕食後       ₂₈ 日分\n（処方 ₃ ）\nレジパスビル・ソホスブビル配合錠        ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    夕食後    ₂₈ 日分\n問 291（病態・薬物治療）\n処方 ₃ 追加時とその ₂ ケ月後受診時の検査値は下表のとおりであった。\n（身体所見並びに検査結果）\n項目               処方 ₃ 追加時   ₂ ケ月後受診時\n身長（cm）                 ₁₆₅        ₁₆₅\n体重（kg）                 ₈₀          ₈₂\nBMI                ₂₉ . ₄      ₃₀ . ₁\nHbA₁c（％）                ₈.₂        ₈.₃\neGFR（mL/min/₁ . ₇₃ m ）      ₄₀          ₂₉\n血圧（mmHg）              ₁₃₀/₈₀      ₁₃₂/₈₀\nAST（IU/L）               ₆₅          ₇₀\nALT（IU/L）               ₇₀          ₈₂\n尿タンパク                  !           +\n検査結果を見た医師から、院内における採用薬の確認と治療薬の変更について、\n薬剤部に問合せがあった。\n検査値から判断し、処方 ₃ の薬剤を変更することにした。変更後の治療薬とし\nて、最も適切なのはどれか。1つ選べ。\n1     ラミブジン\n2     グレカプレビル・ピブレンタスビル配合錠\n3     エンテカビル\n4     テノホビルアラフェナミド\n5     ソホスブビル・ベルパタスビル配合錠+リバビリン",
    "choices": [
      {
        "key": 1,
        "text": "ラミブジン"
      },
      {
        "key": 2,
        "text": "グレカプレビル・ピブレンタスビル配合錠"
      },
      {
        "key": 3,
        "text": "エンテカビル"
      },
      {
        "key": 4,
        "text": "テノホビルアラフェナミド"
      },
      {
        "key": 5,
        "text": "ソホスブビル・ベルパタスビル配合錠+リバビリン"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q291.png"
  },
  {
    "id": "r110-292",
    "year": 110,
    "question_number": 292,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "50歳男性。4ヶ月前に、僧帽弁閉鎖不全症に対して、自己の僧帽弁を温存する僧帽弁形成術が施行された。その後、外来で経過観察を行っていたが、継続する38℃台の発熱、手掌や足底に紅斑が認められ、精査目的で入院となった。入院時施行された経食道心エコーでは、僧帽弁周囲に疣贅（疣腫）が認められた。原因微生物を同定するため血液培養検査を実施した結果、メチシリン感受性黄色ブドウ球菌が検出されたため、感染性心内膜炎と診断された。脳膿瘍や髄膜炎の合併症は認められなかった。主治医からの依頼があり、抗菌薬適正使用支援チームとして介入することとなった。\n問292（病態・薬物治療）\n\nこの患者の合併症と治療に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "貧血の所見があり、出血性病変の合併が疑われる。"
      },
      {
        "key": 2,
        "text": "腎機能が低下し、腎梗塞の合併が疑われる。"
      },
      {
        "key": 3,
        "text": "疣贅による僧帽弁の障害により、心不全を合併するリスクがある。"
      },
      {
        "key": 4,
        "text": "脳塞栓症よりも、肺塞栓症を合併するリスクが高い。"
      },
      {
        "key": 5,
        "text": "血液培養の結果から、抗菌薬としてセファゾリンが推奨される。"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\n本患者の検査結果において、Hb 15.6 g/dL（正常値：13〜17 g/dL）は基準内であり、出血性病変を伴うような明らかな貧血は認められない。\n\n２　誤\n\n検査値より、BUN 16.3 mg/dL（基準：8〜20）、Cr 0.85 mg/dL、尿潜血（－）・蛋白（－）と基準値範囲内であり、腎機能が低下している可能性は低い。\n\n３　正\n\n感染性心内膜炎の合併症として、心不全を起こす頻度が高く、特に左心系弁（僧帽弁や大動脈弁）が感染源となる場合に多くみられる。感染により弁の破壊が生じることで逆流を引き起こすことや疣贅による弁狭窄が心不全の一因となる。\n\n４　誤\n\n感染性心内膜炎では塞栓症を合併することがある。僧帽弁は左心房と左心室の間に位置する左心系の弁であるため、ここに付着した疣贅がはがれ、脳へ飛散することで脳梗塞（脳塞栓症）を引き起こすことがある。一方で、三尖弁など右心系弁に感染が及ぶと、肺塞栓症の原因となることが多い。\n\n５　正\n\n血液培養の結果、メチシリン感受性黄色ブドウ球菌が検出された場合、抗菌薬として、セファゾリンが推奨される。",
    "tags": []
  },
  {
    "id": "r110-293",
    "year": 110,
    "question_number": 293,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 292−293      ₅₀ 歳男性。 ₄ ケ月前に、僧帽弁閉鎖不全症に対して、自己の僧帽弁を温存\nする僧帽弁形成術が施行された。その後、外来で経過観察を行っていたが、継続す\nる ₃₈ ℃台の発熱、手掌や足底に紅斑が認められ、精査目的で入院となった。入院\nゆうぜい\n時施行された経食道心エコーでは、僧帽弁周囲に疣贅（疣腫）が認められた。原因\n微生物を同定するため血液培養検査を実施した結果、メチシリン感受性黄色ブドウ\n球菌が検出されたため、感染性心内膜炎と診断された。脳膿瘍や髄膜炎の合併症は\n認められなかった。主治医からの依頼があり、抗菌薬適正使用支援チームとして介\n入することとなった。\n（入院時検査所見）\n白血球 ₁₂ , ₅₀₀/nL、CRP ₇ . ₅ mg/dL（基準値 ₀ . ₁₄ mg/dL 以下）、\nHb ₁₅ . ₆ g/dL、AST ₂₅ IU/L、ALT ₁₅ IU/L、BUN ₁₆ . ₃ mg/dL、\n血清クレアチニン ₀ . ₈₅ mg/dL、尿タンパク（-）、尿潜血（-）\n問 293（実務）\nこの患者の抗菌薬を用いた治療において、抗菌薬適正使用支援チームが主治医に\n助言する内容として最も適切なのはどれか。2つ選べ。\n1     指定感染症であるため、速やかに保健所に届出をする。\n2     治療効果確認のための血液培養検体は、複数セット採取する。\n3     治療効果確認のための血液検体採取は、次回抗菌薬点滴開始直前に行う。\n4     血液培養により陰性化が確認された場合、速やかに抗菌薬治療を終了する。\n5     血液培養結果が陽性であっても、CRP が基準値内まで低下すれば抗菌薬治療を\n終了する。",
    "choices": [
      {
        "key": 1,
        "text": "指定感染症であるため、速やかに保健所に届出をする。"
      },
      {
        "key": 2,
        "text": "治療効果確認のための血液培養検体は、複数セット採取する。"
      },
      {
        "key": 3,
        "text": "治療効果確認のための血液検体採取は、次回抗菌薬点滴開始直前に行う。"
      },
      {
        "key": 4,
        "text": "血液培養により陰性化が確認された場合、速やかに抗菌薬治療を終了する。"
      },
      {
        "key": 5,
        "text": "血液培養結果が陽性であっても、CRP が基準値内まで低下すれば抗菌薬治療を 終了する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q293.png"
  },
  {
    "id": "r110-294",
    "year": 110,
    "question_number": 294,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "29歳女性。既婚。3年前に夫をドナーとした生体腎移植（ABO血液型適合）を受け、拒絶反応を抑制するため免疫抑制薬を以下の処方で服用しながら、生活をしている。腎移植後、体調がよくなり生活も安定してきたので、子供を欲しいと思うようになった。\n問294（病態・薬物治療）\n\n患者の希望を考慮すると、今後の免疫抑制薬として選択可能なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "シクロスポリン"
      },
      {
        "key": 2,
        "text": "タクロリムス"
      },
      {
        "key": 3,
        "text": "バシリキシマブ"
      },
      {
        "key": 4,
        "text": "ミゾリビン"
      },
      {
        "key": 5,
        "text": "エベロリムス"
      }
    ],
    "correct_answer": 1,
    "explanation": "妊娠を希望する女性に免疫抑制薬を投与する際には胎児への影響を考慮する必要がある。妊娠を希望する患者に対して使用可能な免疫抑制薬として、シクロスポリン、タクロリムスがある。両剤は、胎盤を通過するが、妊娠中の使用が治療上必要と判断される場合には使用することが可能である。ただし、早産・低出生体重・奇形などのリスクがあるため、リスクとベネフィットを評価して慎重に用いる必要がある。なお、バシリキシマブ、ミゾリビン、エベロリムスは、妊娠中または妊娠の可能性がある女性には投与禁忌である。",
    "tags": []
  },
  {
    "id": "r110-295",
    "year": 110,
    "question_number": 295,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 294−295     ₂₉ 歳女性。既婚。 ₃ 年前に夫をドナーとした生体腎移植（ABO 血液型適\n合）を受け、拒絶反応を抑制するため免疫抑制薬を以下の処方で服用しながら、生\n活をしている。腎移植後、体調がよくなり生活も安定してきたので、子供を欲しい\nと思うようになった。\n（処方）\nシクロスポリンカプセル ₂₅ mg   ₁ 回 ₃ カプセル（ ₁ 日 ₆ カプセル）\n₁日₂回   朝夕食後   ₂₈ 日分\n問 295（実務）\n₁ 年後、この患者は妊娠したが、妊娠第 ₂₅ 週目になって血圧の上昇（₁₅₄/₁₁₂\nmmHg）がみられたため入院し、降圧療法を行うことになった。なお、入院時の\n血液検査結果は以下のとおりである。\n（検査値）\nBUN ₁₈ mg/dL、血清クレアチニン ₀ . ₇ mg/dL、eGFR ₈₀ mL/min/₁ . ₇₃ m 、\nNa ₁₄₃ mEq/L、K ₅ . ₂ mEq/L、Cl ₁₀₅ mEq/L\nこの患者に対して禁忌ではなく、用いることができる降圧薬はどれか。2つ選\nべ。\n1     アテノロール\n2     エナラプリルマレイン酸塩\n3     エサキセレノン\n4     バルサルタン\n5     ニフェジピン",
    "choices": [
      {
        "key": 1,
        "text": "アテノロール"
      },
      {
        "key": 2,
        "text": "エナラプリルマレイン酸塩"
      },
      {
        "key": 3,
        "text": "エサキセレノン"
      },
      {
        "key": 4,
        "text": "バルサルタン"
      },
      {
        "key": 5,
        "text": "ニフェジピン"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q295.png"
  },
  {
    "id": "r110-296",
    "year": 110,
    "question_number": 296,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "25歳女性。既婚。子供を欲しいと思っている。2ヶ月ほど前から屋外での作業の後、微熱、疲労感、関節痛及び両頬に紅斑が現れたため、市販の感冒薬と解熱鎮痛薬で様子を見ていた。3日前から38°C台の発熱と下肢の浮腫、冷たいものを持つと両手指のしびれ蒼白現象などが出現したため、総合病院を受診したところ、精査目的で入院となった。\n\n　血液検査結果は以下のとおりであった。\n問296（病態・薬物治療）\n\nこの患者の病態に関する記述として正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "関節リウマチの典型的な初期症状が発現している。"
      },
      {
        "key": 2,
        "text": "発症には、主に細胞性免疫（Ⅳ型アレルギー）が関与する。"
      },
      {
        "key": 3,
        "text": "検査結果より、ループス腎炎は否定できる。"
      },
      {
        "key": 4,
        "text": "手指にRaynaud（レイノー）現象が認められる。"
      },
      {
        "key": 5,
        "text": "粘膜症状や精神神経系症状など多様な全身症状が現れることがある。"
      }
    ],
    "correct_answer": 4,
    "explanation": "１　誤\n\n本症例では、抗核抗体640倍、抗Sm抗体8倍であることから全身エリテマトーデス（SLE）の疑いが強く、関節リウマチの初期症状が発現している可能性は低い。\n\n２　誤\n\n　SLEの発症には、免疫複合体が組織に沈着するⅢ型アレルギーが関与する。\n\n３　誤\n\n本症例では、腎機能検査（BUN 45 mg/dL（基準値：8〜20mg/dL）、尿タンパク2＋、クレアチニン2.0 mg/dL（基準値：0.2〜0.9 mg/dL））は異常であり、ループス腎炎の可能性が高い。\n\n４　正\n\nRaynaud現象（冷感刺激や精神的なストレスによって生じる末梢循環障害）は、SLEにしばしば合併する症状の一つである。本症例にみられる両手指のしびれや蒼白現象の出現は、Raynaud現象であると考えられる。\n\n５　正\n\n　SLEは、慢性の全身性自己免疫疾患であり、皮膚、関節、腎臓、神経系など多様な全身症状を呈する疾患である。",
    "tags": []
  },
  {
    "id": "r110-297",
    "year": 110,
    "question_number": 297,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 296−297        ₂₅ 歳女性。既婚。子供を欲しいと思っている。 ₂ ケ月ほど前から屋外での\n作業の後、微熱、疲労感、関節痛及び両頬に紅斑が現れたため、市販の感冒薬と解\n熱鎮痛薬で様子を見ていた。 ₃ 日前から ₃₈ ℃台の発熱と下肢の浮腫、冷たいもの\nを持つと両手指のしびれ・蒼白現象などが出現したため、総合病院を受診したとこ\nろ、精査目的で入院となった。\n血液検査結果は以下のとおりであった。\n（検査値）\n白血球 ₂ , ₈₀₀/nL、赤血球 ₄₀₀ # ₁₀ /nL、血小板 ₉ . ₃ # ₁₀ /nL、\n4                 4\n血中総ビリルビン ₀ . ₆ mg/dL、ALT ₂₆ IU/L、AST ₁₅ IU/L、\nBUN ₄₅ mg/dL、血清クレアチニン ₂ . ₀ mg/dL、抗核抗体 ₆₄₀ 倍、\n抗 Sm 抗体 ₈ 倍、尿タンパク（₂+）\n問 297（実務）\nその後、この患者に対して、以下の処方で治療が開始されることになった。\n（処方）\nプレドニゾロン錠 ₅ mg   朝 ₃ 錠、昼 ₂ 錠、夕 ₁ 錠（ ₁ 日 ₆ 錠）\n₁日₃回      朝昼夕食後   ₇ 日分\nこの患者に対する入院中から退院時の服薬指導において、病棟薬剤師が患者に伝\nえる内容として適切なのはどれか。2つ選べ。\n1     重篤な臓器障害が発症した場合は、ステロイドパルス療法として ₁ クール ₇ 日\n間点滴投与すること。\n2     ステロイド抵抗性を示した場合は、免疫抑制薬が追加されること。\n3     退院後の維持療法では、同用量のプレドニゾロンが用いられること。\n4     屋外での作業時には日よけをすること。\n5     妊娠は、病状に影響しないこと。",
    "choices": [
      {
        "key": 1,
        "text": "重篤な臓器障害が発症した場合は、ステロイドパルス療法として ₁ クール ₇ 日 間点滴投与すること。"
      },
      {
        "key": 2,
        "text": "ステロイド抵抗性を示した場合は、免疫抑制薬が追加されること。"
      },
      {
        "key": 3,
        "text": "退院後の維持療法では、同用量のプレドニゾロンが用いられること。"
      },
      {
        "key": 4,
        "text": "屋外での作業時には日よけをすること。"
      },
      {
        "key": 5,
        "text": "妊娠は、病状に影響しないこと。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q297.png"
  },
  {
    "id": "r110-298",
    "year": 110,
    "question_number": 298,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "35歳男性。肘や膝に黄色っぽい隆起が見られるようになったため、心配になり医療機関を受診したところ、精査目的にて入院となった。身体所見及び検査値と家族歴は、以下のとおりであった。\nまた問診の結果、3ヶ月前に他の医療機関でLDLコレステロール高値を指摘されロスバスタチンにて治療を行っていたが、1ヶ月前から筋肉痛や脱力感を自覚するようになったため、最近1週間は自己判断で服用を中止していることが分かった。今回の診察で、肘や膝の皮膚の隆起は皮膚結節性黄色腫であることが判明し、アキレス腱にも著明な肥厚が見られた（X線撮影により肥厚は9.0mm）。\n問298（実務）\n\nこの患者に対して薬剤師がアセスメントを行うために備えるべき知識として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "食事療法に際し、炭水化物エネルギー比を50〜60%とする。"
      },
      {
        "key": 2,
        "text": "運動療法を行う前に、動脈硬化性疾患のスクリーニングを実施する。"
      },
      {
        "key": 3,
        "text": "LDL−C管理目標値は120mg/dLである。"
      },
      {
        "key": 4,
        "text": "半年に一度のLDLアフェレシスを提案する。"
      },
      {
        "key": 5,
        "text": "筋肉痛と脱力感は、ロスバスタチンを継続投与しても自然に消失する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "本患者はLDL-C値が262 mg/dLと著明な高値を示しており、また父親に心筋梗塞の既往があること、さらに身体所見としてアキレス腱の肥厚および皮膚結節性黄色腫が認められている。これらの所見は家族性高コレステロール血症（FH）診断基準に合致する。\n\n・高LDL-C血症（空腹時LDL-C ≧180 mg/dL）\n\n・腱黄色腫（アキレス腱肥厚）または皮膚結節性黄色腫の存在\n\n・FHまたは早発性冠動脈疾患の既往を有する一親等以内の家族\n\n本患者は、上記の3項目すべてを満たしており、FHであると考えられる。\n\n１　正\n\n食事から摂取するエネルギー比として、炭水化物：50〜60%、脂質：25%以下、タンパク質：20%以上は、動脈硬化予防に準じた適正比率である。\n\n２　正\n\n　FH患者は、高LDL血症により動脈硬化性疾患リスクが高い。そのため、運動療法を行う前に心電図、運動負荷心電図、心エコー検査等で動脈硬化性疾患のスクリーニングが必要である。\n\n３　誤\n\n　FH患者の一次予防では、LDL−C管理目標値は100 mg/dL未満が目標である。\n\n４　誤\n\n　FH患者に対して、1〜4週間に1回の頻度で",
    "tags": []
  },
  {
    "id": "r110-299",
    "year": 110,
    "question_number": 299,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 298−299       ₃₅ 歳男性。肘や膝に黄色っぽい隆起が見られるようになったため、心配に\nなり医療機関を受診したところ、精査目的にて入院となった。身体所見及び検査値\nと家族歴は、以下のとおりであった。\n（身体所見及び検査値）\n身長 ₁₆₈ cm、体重 ₇₆ kg、血圧 ₁₁₈/₇₆ mmHg、LDL︲C ₂₆₂ mg/dL、\nHDL︲C ₆₂ mg/dL、TG（トリグリセリド）₁₄₅ mg/dL、\n空腹時血糖 ₁₁₃ mg/dL、HbA₁c ₅ . ₉％、AST ₁₀₂ IU/L、ALT ₂₂ IU/L、\nCK（クレアチンキナーゼ）₄ , ₂₁₅ IU/L\n（家族歴）\n父親が ₅₀ 歳で心筋梗塞を発症\nまた問診の結果、 ₃ ケ月前に他の医療機関で LDL コレステロール高値を指摘さ\nれロスバスタチンにて治療を行っていたが、 ₁ ケ月前から筋肉痛や脱力感を自覚す\nるようになったため、最近 ₁ 週間は自己判断で服用を中止していることが分かっ\nた。今回の診察で、肘や膝の皮膚の隆起は皮膚結節性黄色腫であることが判明し、\nアキレス腱にも著明な肥厚が見られた（X 線撮影により肥厚は ₉ . ₀ mm）。\n問 299（病態・薬物治療）\n検査所見と診察の結果から判断してロスバスタチンを変更することになった。変\n更後の治療薬として適切なのはどれか。2つ選べ。\n1     ピタバスタチン\n2     エゼチミブ\n3     ペマフィブラート\n4     エボロクマブ\n5     イコサペント酸エチル",
    "choices": [
      {
        "key": 1,
        "text": "ピタバスタチン"
      },
      {
        "key": 2,
        "text": "エゼチミブ"
      },
      {
        "key": 3,
        "text": "ペマフィブラート"
      },
      {
        "key": 4,
        "text": "エボロクマブ"
      },
      {
        "key": 5,
        "text": "イコサペント酸エチル"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q299.png"
  },
  {
    "id": "r110-300",
    "year": 110,
    "question_number": 300,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "55歳女性。45歳時に気管支ぜん息と診断されたことをきっかけに節煙した。しかし、仕事によるストレスで喫煙の回数と飲酒量がここ最近増えている。3年前から、ブデソニド/ホルモテロールフマル酸塩水和物吸入剤を使用していたが、効果不十分のため、半年前からは処方1の薬剤を使用している。その他の併用薬と副作用歴はない。\n今回もこの患者が処方1の処方箋を持って保険薬局に来局した。薬剤師が患者にインタビューしたところ、次の回答を得た。\n問300（病態・薬物治療）\n\n　処方1の薬剤について特に注意すべき副作用はどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "高カリウム血症"
      },
      {
        "key": 2,
        "text": "低血糖"
      },
      {
        "key": 3,
        "text": "間質性肺炎"
      },
      {
        "key": 4,
        "text": "動悸"
      },
      {
        "key": 5,
        "text": "口腔カンジダ症"
      }
    ],
    "correct_answer": 4,
    "explanation": "この患者が使用している吸入薬「テリルジー100エリプタ」には、3種類の有効成分が含まれている。\n\n【含有成分と分類】\n\n・ビランテロール：長時間作用型β₂刺激薬（LABA）\n\n→ 主な副作用：動悸、振戦、低カリウム血症など\n\n・フルチカゾンフランカルボン酸エステル：吸入用ステロイド（ICS）\n\n→ 主な副作用：口腔カンジダ症、嗄声、咽頭刺激など\n\n・ウメクリジニウム：長時間作用型抗コリン薬（LAMA）\n\n→ 主な副作用：口渇、排尿困難、便秘など\n\n【特に注意が必要な副作用】\n\n　β₂刺激薬のビランテロールは交感神経を刺激する作用により、動悸が起こりやすくなる。また、吸入ステロイドのフルチカゾンは、口腔内の免疫低下を引き起こしやすく、白色の苔のような病変（口腔カンジダ症）を招くことがある。これを防ぐためには、吸入後には「うがい」や「口すすぎ」を行うことが非常に重要である。",
    "tags": []
  },
  {
    "id": "r110-301",
    "year": 110,
    "question_number": 301,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 300−301       ₅₅ 歳女性。₄₅ 歳時に気管支ぜん息と診断されたことをきっかけに節煙し\nた。しかし、仕事によるストレスで喫煙の回数と飲酒量がここ最近増えている。\n₃ 年前から、ブデソニド／ホルモテロールフマル酸塩水和物吸入剤を使用していた\nが、効果不十分のため、半年前からは処方 ₁ の薬剤を使用している。その他の併用\n薬と副作用歴はない。\n（処方 ₁ ）\nテリルジー ₁₀₀ エリプタ   ₃₀ 吸入用         ₁個\n（注）\n₁ 回 ₁ 吸入   ₁日₁回   朝吸入\n注： ₁ 吸入でフルチカゾンフランカルボン酸エステルとして ₁₀₀ ng、ウメ\nクリジニウムとして ₆₂ . ₅ ng 及びビランテロールとして ₂₅ ng を吸入で\nきるドライパウダー吸入剤\n今回もこの患者が処方 ₁ の処方箋を持って保険薬局に来局した。薬剤師が患者に\nインタビューしたところ、次の回答を得た。\n患者：\n「きちんと吸入していますが、最近、咳が出て調子が悪いです。特に、花粉\nの飛散時期は咳が出やすいです。ピークフローメータをあまり使っていな\nかったので、もう一度、使い方と意義について教えてほしいです。」\n問 301（実務）\n患者に対する薬剤師の説明内容として適切でないのはどれか。1つ選べ。\n1     ピークフローメータは深呼吸をしてから口に加え、毎回同じ姿勢で測定する。\n2     ピークフロー値は ₁ 秒量とよく相関し、ぜん息の状態を把握する指標となる。\n3 ピークフローメータは息がもれないように吹き口を唇で覆い、できるだけすば\nやく一気に吹く。\n4     ピークフロー値は一度に少なくとも ₃ 回測定し、最も低い値を記録する。\n5 ピークフロー値の日内変動が大きい場合は、気道過敏性が亢進していると考え\nられる。",
    "choices": [
      {
        "key": 1,
        "text": "ピークフローメータは深呼吸をしてから口に加え、毎回同じ姿勢で測定する。"
      },
      {
        "key": 2,
        "text": "ピークフロー値は ₁ 秒量とよく相関し、ぜん息の状態を把握する指標となる。"
      },
      {
        "key": 3,
        "text": "ピークフロー値は一度に少なくとも ₃ 回測定し、最も低い値を記録する。"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q301.png"
  },
  {
    "id": "r110-302",
    "year": 110,
    "question_number": 302,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "75歳男性。慢性胃炎の既往がある。2年前に脳梗塞を発症し、それ以来、処方1及び処方2の薬剤を継続的に服用している。\n咳と嗄声が続き、血痰を認めたため近医を受診し、胸部X線で右肺腫瘤を指摘された。総合病院呼吸器内科を紹介受診し、入院して精査した結果、StageⅣBの非小細胞肺がん（腺がん）と診断された。遺伝子検査も実施され、EGFR遺伝子変異陽性と判明した。パフォーマンスステータス（PS）1。患者に喫煙歴はなく、機会飲酒のみ。外来通院治療を強く希望したため、ゲフィチニブ（処方３）での治療を開始することになり、処方1、処方2とも総合病院で一括して処方することになった。\n状態が安定したら退院し、処方1〜3の薬剤での治療を継続する予定である。\n問302（病態・薬物治療）\n\nこの患者の病態と治療に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "肺野部に発生することが多いがんである。"
      },
      {
        "key": 2,
        "text": "発症前と同じ日常生活が制限なく行える。"
      },
      {
        "key": 3,
        "text": "他臓器に遠隔転移している。"
      },
      {
        "key": 4,
        "text": "手術での根治切除が可能である。"
      },
      {
        "key": 5,
        "text": "腫瘍マーカーとして、SCC抗原（squamous cell carcinoma related antigen）が用いられる。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n肺がんの組織型のうち、「腺がん」や「大細胞がん」は主に肺野部に発生する傾向がある。一方、扁平上皮がんや小細胞がんは、気管支に近い肺門部に好発する。\n\n２　誤\n\n本患者はPS1であり、軽作業は可能だが、激しい身体活動には制限がある状態である。\n\n３　正\n\n本患者は「Stage IVB」の非小細胞肺がんと診断されている。TNM分類におけるステージIVBは、がんが肺外の他臓器（脳、肝、骨など）に遠隔転移している状態であり、根治的な外科手術の対象とはならず、薬物療法が中心となる。\n\n４　誤\n\nStage IVBは進行がんに該当し、すでに遠隔転移が認められているため、手術による根治は原則不可能である。治療の目的は、延命や症状緩和、QOLの向上であり、分子標的薬や化学療法が中心となる。\n\n５　誤\n\nSCC抗原（squamous cell carcinoma antigen）は、扁平上皮がんで用いられる腫瘍マーカーである。なお、腺がんの代表的な腫瘍マーカーとして、CEA（carcinoembryonic antigen）がある。",
    "tags": []
  },
  {
    "id": "r110-303",
    "year": 110,
    "question_number": 303,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 302−303       ₇₅ 歳男性。慢性胃炎の既往がある。 ₂ 年前に脳梗塞を発症し、それ以来、\n処方 ₁ 及び処方 ₂ の薬剤を継続的に服用している。\n（処方 ₁ ）\nワルファリンカリウム錠 ₁ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₂₈ 日分\n（処方 ₂ ）\nレバミピド錠 ₁₀₀ mg      ₁ 回 ₁ 錠（ ₁ 日 ₃ 錠）\n₁日₃回    朝昼夕食後       ₂₈ 日分\n咳と嗄声が続き、血痰を認めたため近医を受診し、胸部 X 線で右肺腫瘤を指摘\nされた。総合病院呼吸器内科を紹介受診し、入院して精査した結果、Stage ⅣB の\n非小細胞肺がん（腺がん）と診断された。遺伝子検査も実施され、EGFR 遺伝子\n変異陽性と判明した。パフォーマンスステータス（PS） ₁ 。患者に喫煙歴はな\nく、機会飲酒のみ。外来通院治療を強く希望したため、ゲフィチニブ（処方 ₃ ）で\nの治療を開始することになり、処方 ₁ 、処方 ₂ とも総合病院で一括して処方するこ\nとになった。\n（処方 ₃ ）\nゲフィチニブ錠 ₂₅₀ mg     ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₁₄ 日分\n状態が安定したら退院し、処方 ₁ ～ ₃ の薬剤での治療を継続する予定である。\n問 303（実務）\n処方 ₃ の開始にあたり、病棟薬剤師の対応として、適切なのはどれか。2つ選\nべ。\n1     ゲフィチニブによる手足症候群を予防するため、レボフロキサシンの追加を医\n師に提案する。\n2     レバミピドをオメプラゾールに変更するよう医師に処方提案する。\n3 プロトロンビン時間が延長する可能性があるので、ワルファリンカリウムの用\n量調節を医師に提案する。\n4     退院後の服薬時に息切れ、呼吸困難、発熱などの症状が現れたらすぐに受診す\nるよう、患者に説明する。\n5 ゲフィチニブの効果を減弱させる可能性があるため、グレープフルーツジュー\nスの摂取を避けるよう患者に説明する。",
    "choices": [
      {
        "key": 1,
        "text": "ゲフィチニブによる手足症候群を予防するため、レボフロキサシンの追加を医 師に提案する。"
      },
      {
        "key": 2,
        "text": "レバミピドをオメプラゾールに変更するよう医師に処方提案する。"
      },
      {
        "key": 3,
        "text": "退院後の服薬時に息切れ、呼吸困難、発熱などの症状が現れたらすぐに受診す るよう、患者に説明する。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q303.png"
  },
  {
    "id": "r110-304",
    "year": 110,
    "question_number": 304,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "58歳女性。乳がんによる骨転移性疼痛に対して、デノスマブ皮下注とモルヒネ硫酸塩水和物徐放錠にて治療中であった。腰痛の悪化により、モルヒネ硫酸塩水和物徐放錠が増量された。FDG-PET（注）を行ったところ、腰椎に集積像が確認された。増量後は、疼痛コントロールは良好であったが、日常生活に支障をきたすほどの眠気が増強してきたため来院し、患者希望により緩和ケアチームが関与することになった。来院時の検査値は以下のとおりである。\n問304（病態・薬物治療）\n\nこの患者の腰椎病変に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "病変は、乳がんの直接浸潤により生じたと考えられる。"
      },
      {
        "key": 2,
        "text": "病変部では、ブドウ糖の取り込みが上昇している。"
      },
      {
        "key": 3,
        "text": "脊髄圧迫が生じている可能性が高い。"
      },
      {
        "key": 4,
        "text": "症状の緩和には、ビタミンDの摂取が有効である。"
      },
      {
        "key": 5,
        "text": "高用量メトトレキサートを中心とした化学療法が奏功する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n乳がんの骨転移は、血行性またはリンパ行性によってがん細胞が運ばれ、骨組織に定着・増殖する過程で生じる。直接浸潤は、乳腺に隣接する肋骨などへの局所的な進展を指し、腰椎のような遠隔部位への病変はこれに該当しない。\n\n２　正\n\nがん細胞は、通常の細胞よりも糖代謝が活発であり、PET検査で使用されるFDG（フルオロデオキシグルコース）というブドウ糖類似の放射性物質を多く取り込む。そのため、骨転移部ではFDGの集積が明瞭に観察される。\n\n３　正\n\n腰椎の骨転移では、腫瘍による骨破壊や腫瘤形成が脊髄や神経根を圧迫し、麻痺や排尿障害などの重篤な神経症状を引き起こす場合がある。本症例ではFDG-PETで腰椎への集積像が確認されており、脊髄圧迫の可能性が高いと考えられる。\n\n４　誤\n\nビタミンDは、骨代謝に関与するが、骨転移による疼痛や進行抑制に対する治療効果はほとんど期待できない。骨転移に伴う骨吸収亢進や骨破壊に対しては、ビスホスホネート製剤やデノスマブ（破骨細胞抑制薬）が推奨される。\n\n５　誤\n\nメトトレキサートは、重度の腎障害を有する患者には使用できない。本患者のeGFRは26.7 mL",
    "tags": []
  },
  {
    "id": "r110-305",
    "year": 110,
    "question_number": 305,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 304−305       ₅₈ 歳女性。乳がんによる骨転移性疼痛に対して、デノスマブ皮下注とモル\nヒネ硫酸塩水和物徐放錠にて治療中であった。腰痛の悪化により、モルヒネ硫酸塩\n水和物徐放錠が増量された。FDG︲PET                        を行ったところ、腰椎に集積像が確認\n（注）\nされた。増量後は、疼痛コントロールは良好であったが、日常生活に支障をきたす\nほどの眠気が増強してきたため来院し、患者希望により緩和ケアチームが関与する\nことになった。来院時の検査値は以下のとおりである。\n（注）FDG︲PET：Fluorodeoxyglucose-Positron emission tomography（ フ ル オ ロ\nデオキシグルコース陽電子放出断層撮影）\n（検査値）\nAST ₁₅ IU/L、ALT ₁₆ IU/L、BUN ₃₅ . ₀ mg/dL、\n血清クレアチニン ₁ . ₆ mg/dL、eGFR ₂₆ . ₇ mL/min/₁ . ₇₃ m2\n問 305（実務）\n緩和ケアチームの薬剤師の対応として、適切なのはどれか。2つ選べ。\n1 デノスマブ皮下注の投与中は、低カルシウム血症の発現に注意するよう、情報\n共有する。\n2     デノスマブ皮下注からゾレドロン酸水和物注射液への変更を検討する。\n3     モルヒネ硫酸塩水和物徐放錠の投与中は、QT 延長の副作用の発現に注意する\nよう、情報共有する。\n4     モルヒネ硫酸塩水和物徐放錠からフェンタニルクエン酸塩テープへの変更を検\n討する。\n5     モルヒネ硫酸塩水和物徐放錠からロキソプロフェンナトリウム錠への変更を検\n討する。",
    "choices": [
      {
        "key": 1,
        "text": "デノスマブ皮下注からゾレドロン酸水和物注射液への変更を検討する。"
      },
      {
        "key": 2,
        "text": "モルヒネ硫酸塩水和物徐放錠の投与中は、QT 延長の副作用の発現に注意する よう、情報共有する。"
      },
      {
        "key": 3,
        "text": "モルヒネ硫酸塩水和物徐放錠からフェンタニルクエン酸塩テープへの変更を検 討する。"
      },
      {
        "key": 4,
        "text": "モルヒネ硫酸塩水和物徐放錠からロキソプロフェンナトリウム錠への変更を検 討する。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q305.png"
  },
  {
    "id": "r110-306",
    "year": 110,
    "question_number": 306,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "70歳女性。20年前に糖尿病と診断され、通院加療していたが、内服薬のみでのコントロールが困難となり、インスリン導入目的で入院となった。インスリンを使用し、血糖コントロールが良好となったため、まもなく退院できる見込みである。患者より、インスリン投与前に自己検査用グルコース測定器(注)を用いて行う血糖自己測定について退院前に再度説明して欲しいとの訴えがあった。患者に困ったことはないか質問すると、穿刺後血液が少ししか出ないことや、「測定できません」と表示され再検査しなければならないことが多くて困るとのことであった。\n（注）この患者が使用している自己検査用グルコース測定器：以下に特徴を列記し、形状等を図で示す。\n\n・医療機器承認番号が付されている。\n\n・高度管理医療機器である。\n\n・特定保守管理医療機器である。\n問306（実務）\n\n　この患者への説明として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "指に糖分などがついていると測定結果に影響が出るため、穿刺前は手を流水で洗ってください。"
      },
      {
        "key": 2,
        "text": "消毒した指はよく乾かしてから穿刺してください。"
      },
      {
        "key": 3,
        "text": "穿刺前に指先を冷やすと血液が出やすくなります。"
      },
      {
        "key": 4,
        "text": "穿刺しても血液が出ない場合は、指先を強く押して血液を絞り出してください。"
      },
      {
        "key": 5,
        "text": "1回の穿刺で血液が測定用チップに十分に吸引できず測定できなかった場合は、新たに穿刺し、同じチップに血液を追加で吸引してください。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\n糖分を含む食品を触った後に指先から採血すると、皮膚に残った糖分が血液と混じり、偽高値となることがある。アルコール綿での消毒だけでは糖分の除去が不十分であるため、穿刺前には流水で手をよく洗うことが推奨される。\n\n２　正\n\nアルコールなどの消毒液が皮膚に残っていると、血液が球状にならず、吸引不良や測定エラーの原因となる。したがって、十分に乾燥させてから穿刺する必要がある。\n\n３　誤\n\n冷やすことで血管が収縮し、血流が悪くなるため、血液は出にくくなる。逆に、手を温めたりマッサージしたりすることで、血流が促進されて採血しやすくなる。\n\n４　誤\n\n強く押しすぎると組織液が混入し、正確な血糖値を得られなくなる可能性がある。穿刺後は軽く押す程度にし、自然な出血を促すことが望ましい。\n\n５　誤\n\n　1回の穿刺で血液が測定用チップに十分に吸引できず測定できなかった場合は、新しい測定チップを用いて、あらためて穿刺する必要がある",
    "tags": []
  },
  {
    "id": "r110-307",
    "year": 110,
    "question_number": 307,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 306−307     ₇₀ 歳女性。₂₀ 年前に糖尿病と診断され、通院加療していたが、内服薬の\nみでのコントロールが困難となり、インスリン導入目的で入院となった。インスリ\nンを使用し、血糖コントロールが良好となったため、まもなく退院できる見込みで\nある。患者より、インスリン投与前に自己検査用グルコース測定器           を用いて行\n（注）\nう血糖自己測定について退院前に再度説明して欲しいとの訴えがあった。患者に\n困ったことはないか質問すると、穿刺後血液が少ししか出ないことや、「測定でき\nません」と表示され再検査しなければならないことが多くて困るとのことであっ\nた。\n（注）この患者が使用している自己検査用グルコース測定器：以下に特徴を列記\nし、形状等を図で示す。\n・医療機器承認番号が付されている。\n・高度管理医療機器である。\n・特定保守管理医療機器である。\n＜形状等＞\n電源ボタン\nメインパネル\nチップ装着部\n問 307（法規・制度・倫理）\nこの患者が使用している医療機器の制度上の取扱いについて、正しいのはどれ\nか。2つ選べ。\n1     薬局で販売する場合には、薬局開設の許可のほかに、該当する分類の医療機器\n販売業の許可を受ける必要がある。\n2     不具合が原因となり健康被害が生じた場合、健康被害救済制度の救済給付の対\n象となる。\n3     医療従事者だけでなく一般の人が自宅などでも使用できる医療機器であること\nから、一般医療機器に分類される。\n4     厚生労働大臣に製造販売の届出を行った医療機器である。\n5     保守点検、修理その他の管理に専門的な知識及び技能を必要とする医療機器で\nある。",
    "choices": [
      {
        "key": 1,
        "text": "薬局で販売する場合には、薬局開設の許可のほかに、該当する分類の医療機器 販売業の許可を受ける必要がある。"
      },
      {
        "key": 2,
        "text": "不具合が原因となり健康被害が生じた場合、健康被害救済制度の救済給付の対 象となる。"
      },
      {
        "key": 3,
        "text": "医療従事者だけでなく一般の人が自宅などでも使用できる医療機器であること から、一般医療機器に分類される。"
      },
      {
        "key": 4,
        "text": "厚生労働大臣に製造販売の届出を行った医療機器である。"
      },
      {
        "key": 5,
        "text": "保守点検、修理その他の管理に専門的な知識及び技能を必要とする医療機器で ある。"
      }
    ],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q307.png"
  },
  {
    "id": "r110-308",
    "year": 110,
    "question_number": 308,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "50歳女性。身長155cm、体重48kg。B型肝炎の既往あり。起床時の手指関節のこわばり、肘関節、膝関節の痛みを主訴として受診し、関節リウマチと診断され、処方1と処方2の薬剤で治療していた。その後、炎症がコントロールできず、受診した際に注射薬の追加が提案されたが、患者から「自分で注射するのは怖い。病院内で点滴してほしい。」との要望があったため、処方3が追加されることとなった。なお、処方3の薬剤は、製造販売業者から卸売販売業者を経て、納入されたものである。\n問308（実務）\n\n処方3の薬剤を投与開始するにあたり、この患者に行う説明として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "この薬は、免疫の異常に対して働き、関節の痛みや腫れなどの症状を改善し、関節の破壊を防止します。"
      },
      {
        "key": 2,
        "text": "点滴中に息苦しくなることがありますが、一定時間安静にすれば回復しますので心配いりません。"
      },
      {
        "key": 3,
        "text": "この薬の投与によってB型肝炎の再燃のリスクがありますので、定期的な検査が必要です。"
      },
      {
        "key": 4,
        "text": "命にかかわるような副作用は報告されていない安全なお薬です。"
      },
      {
        "key": 5,
        "text": "点滴治療開始後は、同一成分の自己注射を希望しても変更することはできません。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nアバタセプトは、T細胞の活性化に関与する共刺激シグナルを遮断し、炎症性サイトカインの産生を抑制する。これにより、関節の痛みや腫れなどのリウマチ症状を改善し、関節の破壊を防止する。\n\n２　誤\n\n点滴中に息苦しさや違和感を感じた場合は、アナフィラキシーなどの重篤な副作用の可能性があるため、直ちに点滴を中止し、適切な処置を行う必要がある。\n\n３　正\n\nアバタセプトなどの生物学的製剤は、免疫抑制作用によりB型肝炎ウイルスの再活性化を引き起こす可能性がある。B型肝炎の既往がある患者では、定期的な肝機能検査やHBVマーカーのモニタリングを行う必要がある。\n\n４　誤\n\nアバタセプトは、命に関わる副作用（敗血症、真菌感染症、間質性肺炎など）を起こすことがある。\n\n５　誤\n\n点滴治療開始後、同一成分の自己注射に変更することは可能である。なお、点滴静注用製剤から皮下注製剤に変更する場合、次に予定している点滴静注製剤の代わりに初回皮下注射を行う。",
    "tags": []
  },
  {
    "id": "r110-309",
    "year": 110,
    "question_number": 309,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 308−309 ₅₀ 歳女性。身長 ₁₅₅ cm、体重 ₄₈ kg。B 型肝炎の既往あり。起床時の手指\n関節のこわばり、肘関節、膝関節の痛みを主訴として受診し、関節リウマチと診断\nされ、処方 ₁ と処方 ₂ の薬剤で治療していた。その後、炎症がコントロールでき\nず、受診した際に注射薬の追加が提案されたが、患者から「自分で注射するのは怖\nい。病院内で点滴してほしい。」との要望があったため、処方 ₃ が追加されること\nとなった。\nなお、処方 ₃ の薬剤は、製造販売業者から卸売販売業者を経て、納入されたもの\nである。\n（処方 ₁ ）\nメトトレキサートカプセル ₂ mg       ₁ 回 ₁ カプセル（ ₁ 日 ₂ カプセル）\n毎週   日曜日     ₁日₂回   ₈ 時、₂₀ 時   ₄ 日分（投与実日数）\n（処方 ₂ ）\nメトトレキサートカプセル ₂ mg       ₁ 回 ₁ カプセル（ ₁ 日 ₁ カプセル）\n毎週   月曜日     ₁日₁回   ₈時   ₄ 日分（投与実日数）\n（処方 ₃ ）\n点滴静注   アバタセプト（遺伝子組換え）点滴静注用\n（₂₅₀ mg/バイアル     ₂ 本） ₅₀₀ mg\n生理食塩液 ₁₀₀ mL\n₁日₁回   ₃₀ 分かけて投与\n問 309（法規・制度・倫理）\n処方 ₃ の関節リウマチ治療薬の規制に関する記述として、正しいのはどれか。\n2つ選べ。\n1 この薬剤を使用した医療機関の開設者の氏名及び住所は、卸売販売業者から製\n造販売業者に報告される。\n2     直接の容器・被包には、白地に赤枠、赤字で「生物」の文字が記載されてい\nる。\n3 取り扱う医療関係者は、使用対象者の氏名、住所等の記録を保存しなければな\nらない。\n4 製造販売業者は、製造に用いた生物による感染症に関する最新の論文を知った\nときは、₁₅ 日以内に厚生労働大臣に報告しなければならない。\n5 注意事項等情報（添付文書）又は直接の容器・被包には、製造に用いた生物の\n名称が記載されている。",
    "choices": [],
    "correct_answer": 1,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q309.png"
  },
  {
    "id": "r110-310",
    "year": 110,
    "question_number": 310,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "30歳男性。広告で見たかぜ薬を求めて来局した。購入希望のかぜ薬は要指導医薬品であった。薬剤師が症状など必要な情報の聞き取りをしたところ、この来局者が使用者本人であり、肩のこりや痛みで医師から処方された薬を服用していることがわかった。お薬手帳を持参しており、手帳に記載されていた薬剤以外に服用している薬剤やサプリメントはないとのことであった。\n（来局者が購入希望したかぜ薬の成分）\n\nロキソプロフェンナトリウム水和物\n\nジヒドロコデインリン酸塩\n\nd-クロルフェニラミンマレイン酸塩\n\ndl-メチルエフェドリン塩酸塩\n\nグアイフェネシン\n\n無水カフェイン\n（お薬手帳に記載されていた薬剤）\n\nメコバラミン錠500μg\n\n葛根湯エキス顆粒\n問310（法規・制度・倫理）\n\n男性が購入希望したかぜ薬の販売に関する記述として、正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "鍵のかかる陳列棚であっても、購入者が近づける設備は認められない。"
      },
      {
        "key": 2,
        "text": "説明した内容を購入者が理解したことを確認しなければならない。"
      },
      {
        "key": 3,
        "text": "一定の条件の下で特定販売(インターネット販売)が可能である。"
      },
      {
        "key": 4,
        "text": "薬局では販売できるが、店舗販売業では販売できない。"
      },
      {
        "key": 5,
        "text": "販売した薬局名のほか、販売した薬剤師の氏名も購入者に伝える必要がある。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n要指導医薬品は、購入者が直接手に取れないようにする措置が必要であり、その方法として以下のいずれかを満たせばよいとされている。\n\n・陳列区域に購入者が1.2メートル以内に近づけないようにする\n\n・鍵のかかる設備（ガラスケース等）に陳列する\n\n２　正\n\n要指導医薬品の販売では、薬剤師による情報提供および指導を行い、その内容を購入者が理解していることを確認する必要がある。\n\n３　誤\n\n要指導医薬品は、特定販売（ネット販売）が禁止されている。\n\n４　誤\n\n要指導医薬品は、薬局開設者および店舗販売業者が、薬剤師による対面での情報提供・指導のもとで販売することが可能である。\n\n５　正\n\n要指導医薬品を販売する際には、万一副作用などが生じた場合に適切な対応がとれるよう、薬局名・薬剤師名・連絡先などを購入者に伝えることが義務付けられている。",
    "tags": []
  },
  {
    "id": "r110-311",
    "year": 110,
    "question_number": 311,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 310−311      ₃₀ 歳男性。広告で見たかぜ薬を求めて来局した。購入希望のかぜ薬は要指\n導医薬品であった。薬剤師が症状など必要な情報の聞き取りをしたところ、この来\n局者が使用者本人であり、肩のこりや痛みで医師から処方された薬を服用している\nことがわかった。お薬手帳を持参しており、手帳に記載されていた薬剤以外に服用\nしている薬剤やサプリメントはないとのことであった。\n（来局者が購入希望したかぜ薬の成分）\nロキソプロフェンナトリウム水和物\nジヒドロコデインリン酸塩\nd︲クロルフェニラミンマレイン酸塩\ndl︲メチルエフェドリン塩酸塩\nグアイフェネシン\n無水カフェイン\n（お薬手帳に記載されていた薬剤）\nメコバラミン錠 ₅₀₀ ng\n葛根湯エキス顆粒\n問 311（実務）\n薬剤師は男性に、葛根湯はかぜにも適応があることと、葛根湯の注意事項等情報\n（添付文書）の併用注意に希望したかぜ薬の成分が記載されていることを説明し\nた。このかぜ薬の成分のうち、併用注意の成分はどれか。1つ選べ。\n1     ロキソプロフェンナトリウム水和物\n2     ジヒドロコデインリン酸塩\n3 d︲クロルフェニラミンマレイン酸塩\n4 dl︲メチルエフェドリン塩酸塩\n5     グアイフェネシン",
    "choices": [
      {
        "key": 1,
        "text": "ロキソプロフェンナトリウム水和物"
      },
      {
        "key": 2,
        "text": "ジヒドロコデインリン酸塩"
      },
      {
        "key": 3,
        "text": "グアイフェネシン"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q311.png"
  },
  {
    "id": "r110-312",
    "year": 110,
    "question_number": 312,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "68歳男性。身長172cm、体重63kg。高血圧症及び慢性心不全のため処方1の薬剤を服用していた。今回の受診で血圧が164/90mmHgを示し、処方2へ変更となり、処方箋を持って薬局を訪れた。薬局にて患者に服薬指導を行い薬を渡し、調剤録と薬剤服用歴の記載を行った。薬剤服用歴のP（計画）欄に、「30日処方のため、服用15日後に電話にてフォローアップを行う。（本人の了承済）」と記載した。\n問312（実務）\n\nこのフォローアップを行う際、血圧の値以外に優先して確認すべき症状や状態はどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "動悸やふらつきの出現"
      },
      {
        "key": 2,
        "text": "歯ぐきからの出血の出現"
      },
      {
        "key": 3,
        "text": "まぶしさの出現"
      },
      {
        "key": 4,
        "text": "口内炎の出現"
      },
      {
        "key": 5,
        "text": "体重の急な増加"
      }
    ],
    "correct_answer": 1,
    "explanation": "本設問では、ARB（アンジオテンシンII受容体拮抗薬）であるバルサルタンが増量（40 mg → 80 mg）されており、また、β遮断薬であるビソプロロールも併用されている処方である。このような処方変更後のフォローアップでは、以下の2点を優先的に確認する必要がある。\n\n・動悸やふらつきの出現\n\nバルサルタンやビソプロロールの降圧作用が過剰になると、低血圧によりふらつきや動悸、立ちくらみが起こる可能性がある。\n\n・体重の急な増加\n\nバルサルタンの増量によって腎血流が低下し、これに伴うGFRの低下、尿量の減少、浮腫・体重増加といった連鎖が起こる可能性がある。",
    "tags": []
  },
  {
    "id": "r110-313",
    "year": 110,
    "question_number": 313,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 312−313      ₆₈ 歳男性。身長 ₁₇₂ cm、体重 ₆₃ kg。高血圧症及び慢性心不全のため処方\n₁ の薬剤を服用していた。今回の受診で血圧が ₁₆₄/₉₀ mmHg を示し、処方 ₂ へ変\n更となり、処方箋を持って薬局を訪れた。薬局にて患者に服薬指導を行い薬を渡\nし、調剤録と薬剤服用歴の記載を行った。薬剤服用歴の P（計画）欄に、「₃₀ 日処\n方のため、服用 ₁₅ 日後に電話にてフォローアップを行う。（本人の了承済）」と記\n載した。\n（処方 ₁ ）\nバルサルタン錠 ₄₀ mg            ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nビソプロロールフマル酸塩錠 ₂ . ₅ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₃₀ 日分\n（処方 ₂ ）\nバルサルタン錠 ₈₀ mg            ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nビソプロロールフマル酸塩錠 ₂ . ₅ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₃₀ 日分\n問 313（法規・制度・倫理）\n保険薬局における薬剤服用歴と調剤録（注）に関する内容として、正しいのはどれ\nか。2つ選べ。\n（注）薬剤師法で規定されている調剤録\n1     調剤後、患者の薬剤の使用状況を継続的に把握し、その際指導した内容は、処\n方箋が調剤済みの場合、調剤録への記入事項に該当しない。\n2     調剤録は、調剤した薬剤師ではなく、薬局の管理者が記載しなければならな\nい。\n3     薬局開設者は、薬局に調剤録を備えなければならない。\n4 薬剤服用歴の記録・管理の実施は、薬局の義務であり、調剤報酬の対象とはな\nらない。\n5 保険薬剤師が調剤を行う場合は、患者の服薬状況及び薬剤服用歴を確認しなけ\nればならない。",
    "choices": [
      {
        "key": 1,
        "text": "調剤後、患者の薬剤の使用状況を継続的に把握し、その際指導した内容は、処 方箋が調剤済みの場合、調剤録への記入事項に該当しない。"
      },
      {
        "key": 2,
        "text": "調剤録は、調剤した薬剤師ではなく、薬局の管理者が記載しなければならな い。"
      },
      {
        "key": 3,
        "text": "薬局開設者は、薬局に調剤録を備えなければならない。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q313.png"
  },
  {
    "id": "r110-314",
    "year": 110,
    "question_number": 314,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "ICUに常駐する薬剤師が、この病棟で使用している輸血用血液製剤のうちの血液成分の製剤に関する病棟スタッフ向けの講義を実施し、血液製剤に関する内容やその留意点について質問を受けた。\n\nこの病院で採用されている血液成分の製剤は、赤血球液-LR「日赤」（注）、照射赤血球液-LR「日赤」（注）、濃厚血小板-LR「日赤」（注）、照射濃厚血小板-LR「日赤」（注）、新鮮凍結血漿-LR「日赤」（注）の5種類であるが、ICU病棟では、リスクマネジメントの観点から赤血球液と濃厚血小板は照射済の製剤を使用することが病棟の内規で決まっている。\n問314（実務）\n\nこの病棟で使用される血液成分の製剤について、薬剤師が講義で話す内容として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "赤血球製剤には血液保存液（CPD液）と赤血球保存用の添加液（MAP液）が混合されているため、常温保存が可能である。"
      },
      {
        "key": 2,
        "text": "血小板製剤は振とうしながら保存する必要がある。"
      },
      {
        "key": 3,
        "text": "血漿製剤には血球成分は含まれていないため、使用前の血液型の確認は必要ない。"
      },
      {
        "key": 4,
        "text": "照射されている血液製剤とは、輸血による移植片対宿主病（GVHD）予防目的で、放射線が照射された製品である。"
      },
      {
        "key": 5,
        "text": "新鮮凍結血漿-LR「日赤」は、放射線部で照射後に使用すること。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n赤血球製剤には、保存期間を延長する目的でCPD液やMAP液などの保存液が添加されている。しかし、これらの保存液が含まれていても、赤血球製剤は常温保存することはできない。赤血球は温度変化に弱く、常温や高温で保存すると溶血（赤血球の破壊）が進行する恐れがある。さらに、細菌の増殖などによる感染リスクも高まるため、保存中の品質と安全性を確保するためには、2〜6℃での冷蔵保存が必要である。\n\n２　正\n\n血小板製剤は、20〜24℃の室温で保存され、かつ緩やかに振とう（水平振とう）しながら保存する必要がある。その理由として、血小板が沈降・凝集して塊（クラム）になることを防ぎ、活性と機能を保つためである。また、血小板製剤の有効期間は採血後4日以内と非常に短く、保存条件を守らなければ速やかに使用不適となる。\n\n３　誤\n\n血漿製剤（新鮮凍結血漿など）には赤血球や白血球、血小板といった血球成分は含まれていない。そのため、赤血球型（A型・B型など）に関する直接的な抗原・抗体の問題は比較的少ない。しかし、血漿には自然抗体（例：抗A抗体・抗B抗体）が含まれており、輸血を受ける患者の赤血球に対して免疫反応",
    "tags": []
  },
  {
    "id": "r110-315",
    "year": 110,
    "question_number": 315,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 314−315      ICU に常駐する薬剤師が、この病棟で使用している輸血用血液製剤のうち\nの血液成分の製剤に関する病棟スタッフ向けの講義を実施し、血液製剤に関する内\n容やその留意点について質問を受けた。\nこの病院で採用されている血液成分の製剤は、赤血球液︲LR「日赤」 、照射赤血\n（注）\n球液︲LR「日赤」        、濃厚血小板︲LR「日赤」        、照射濃厚血小板︲LR「日赤」   、\n（注）                  （注）               （注）\n新鮮凍結血漿︲LR「日赤」              の ₅ 種類であるが、ICU 病棟では、リスクマネジメ\n（注）\nントの観点から赤血球液と濃厚血小板は照射済の製剤を使用することが病棟の内規\nで決まっている。\n（注）\n・赤血球液︲LR「日赤」、照射赤血球液︲LR「日赤」：有効成分としてヒト赤血球\nを含む\n・濃厚血小板︲LR「日赤」、照射濃厚血小板︲LR「日赤」：有効成分としてヒト血\n小板を含む\n・新鮮凍結血漿︲LR「日赤」：有効成分としてヒト血漿を含む\n問 315（法規・制度・倫理）\n薬剤師が講義時に受けた質問に対する回答として、誤っているのはどれか。1つ\n選べ。\n1     赤血球製剤の原料となる血液の確保は献血により行われています。\n2     献血の採血は日本赤十字社が行っています。\n3     血液製剤は、大きく ₂ つに分類すると「輸血用血液製剤」と「血漿分画製剤」\nになります。\n4     輸血用血液製剤の国内自給率は ₁₀₀％です。\n5     血液成分の製剤の使用に関する記録は、医療機関において使用日から ₃₀ 年の\n保存義務があります。",
    "choices": [
      {
        "key": 1,
        "text": "赤血球製剤の原料となる血液の確保は献血により行われています。"
      },
      {
        "key": 2,
        "text": "献血の採血は日本赤十字社が行っています。"
      },
      {
        "key": 3,
        "text": "血液製剤は、大きく ₂ つに分類すると「輸血用血液製剤」と「血漿分画製剤」 になります。"
      },
      {
        "key": 4,
        "text": "輸血用血液製剤の国内自給率は ₁₀₀％です。"
      },
      {
        "key": 5,
        "text": "血液成分の製剤の使用に関する記録は、医療機関において使用日から ₃₀ 年の 保存義務があります。"
      }
    ],
    "correct_answer": 5,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q315.png"
  },
  {
    "id": "r110-316",
    "year": 110,
    "question_number": 316,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "10歳男児。小学校では他の児童と比べ、忘れ物が多く、授業中も落ち着きがなく集中力が続かないと担任から指摘され、専門医を受診したところ、注意欠陥・多動性障害(ADHD)と診断された。環境調整や保護者への支援などを行ったが効果が不十分なため、以下の薬剤が開始されることになった。\n問316（実務）\n\n患児と保護者に行う服薬指導として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "このお薬はかまずに服用してください。"
      },
      {
        "key": 2,
        "text": "便の中にお薬が見える場合は、薬が吸収されていない可能性があるため、すぐに連絡してください。"
      },
      {
        "key": 3,
        "text": "このお薬を飲むと食欲が低下することがあるため、症状がひどい場合は相談してください。"
      },
      {
        "key": 4,
        "text": "このお薬の飲み忘れに気付いたら、何時でもかまいませんのでできるだけ早く服用してください。"
      },
      {
        "key": 5,
        "text": "このお薬は、用法・用量を守って服用していれば依存性は出現しません。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nメチルフェニデート塩酸徐放錠（以下：本剤）は、徐放性製剤であるため、かまずに服用する必要がある。\n\n２　誤\n\n本剤は徐放性製剤であり、外殻（マトリックス）がそのまま便に排出されることがある。\n\n服用後に錠剤の殻が便に見られることがあるが、薬の成分は適切に吸収されているため、問題はないことを説明する必要がある。\n\n３　正\n\n本剤は、副作用として食欲低下を引き起こすことがあるため、体重減少などが認められた際には相談するよう保護者に促す必要がある。\n\n４　誤\n\n飲み忘れた場合は、気づいた時点で可能な限り早く1回分を服用するが、午後に服用すると不眠等の副作用リスクがあるため、原則として午後の服用は避けるべきである。\n\n５　誤\n\n本剤には、依存性のリスクがあるため、「用法・用量を守っていれば依存性は出現しない」と指導するのは不適切である。",
    "tags": []
  },
  {
    "id": "r110-317",
    "year": 110,
    "question_number": 317,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 316−317      ₁₀ 歳男児。小学校では他の児童と比べ、忘れ物が多く、授業中も落ち着き\nがなく集中力が続かないと担任から指摘され、専門医を受診したところ、注意欠\n陥・多動性障害（ADHD）と診断された。環境調整や保護者への支援などを行っ\nたが効果が不十分なため、以下の薬剤が開始されることになった。\n（処方）\nメチルフェニデート塩酸塩徐放錠 ₁₈ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₁₄ 日分\n問 317（法規・制度・倫理）\nこの処方薬に関する記述として正しいのはどれか。2つ選べ。\n1 この男児が処方薬を持参して海外に ₁ 週間の家族旅行に行く場合、あらかじめ\n地方厚生局長の許可を受ける必要がある。\n2     調剤されたこの処方薬を薬局が廃棄する場合には、廃棄後 ₃₀ 日以内に都道府\n県知事に届け出なければならない。\n3 医薬関係者向けの新聞又は雑誌など、主として医薬関係者等を対象として行う\n広告以外の広告は禁止されている。\n4     薬局は、鍵をかけた堅固な設備内に保管しなければならない。\n5 薬局で取り扱うには、この処方薬の適正流通管理システムへの登録が必要であ\nる。",
    "choices": [
      {
        "key": 1,
        "text": "調剤されたこの処方薬を薬局が廃棄する場合には、廃棄後 ₃₀ 日以内に都道府 県知事に届け出なければならない。"
      },
      {
        "key": 2,
        "text": "薬局は、鍵をかけた堅固な設備内に保管しなければならない。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q317.png"
  },
  {
    "id": "r110-318",
    "year": 110,
    "question_number": 318,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "79歳男性。難治性の気管支ぜん息と診断され、吸入ステロイド薬及び長時間作用性気管支拡張薬による吸入療法を行っていた。しかし、効果不十分のため3ヶ月前よりメポリズマブ（遺伝子組換え）皮下注が追加され、院内処方にて病院で使用法の指導・確認を行っていた。今月より院外処方となり、薬局に処方1の処方箋を持って訪れた。薬剤師は、患者に練習用模擬ペンにて一連の操作をしてもらい、適切に使用できるか確認することとした。なお、この男性は、同一世帯に75歳の妻がおり、両者とも要支援・要介護認定は受けていない。この夫婦は年金受給者でその他の収入はなく、窓口負担割合が1割である。\n穿刺用針は安全カバーに内蔵されており、針キャップを外し、安全カバーが見えなくなるまで穿刺部位にペン先を押し込むと、針が刺さり、薬液が注入される構造となっている。\n問318（実務）\n\n患者の操作等について薬剤師が確認するポイントとして適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "注入前に、ペンを激しく振ってから、薬液確認窓から薬液があるか確認したか。"
      },
      {
        "key": 2,
        "text": "ペンを注射部位に押し当てる前に、針キャップを外したか。"
      },
      {
        "key": 3,
        "text": "注入前の作動確認として、安全カバーを指でペン本体に押し込み、動くことを確認したか。"
      },
      {
        "key": 4,
        "text": "手を怪我するなどにより、ペンを注射部位に深く押し込むことができなくなっていないか。"
      },
      {
        "key": 5,
        "text": "注射部位に対して斜め45度の角度で押し当て注入したか。"
      }
    ],
    "correct_answer": 2,
    "explanation": "１　誤\n\n注入前に確認窓から薬液が無色〜淡黄色透明であることを確認する。その際、ペンを激しく振らないようにする。\n\n２　正\n\n本剤には、針刺事故を防止するために、針キャップが装着されている。本剤を使用する直前に、透明の針キャップを引き抜く必要がある。\n\n３　誤\n\n穿刺用針が安全カバーに内蔵されており、安全カバーを指でペン本体側に押し込むと、指に針が刺さる可能性がある。よって、安全カバーをペン本体側に指で押し込まないように注意する。\n\n４　正\n\n本剤をしっかり使用するためには、ペンを注射部位に深く押し当てる必要がある。そのため、手の怪我などにより本剤がうまく使用できない状態になっていないか確認する必要がある。\n\n５　誤\n\n本剤を使用する際には、斜めではなく、皮膚に対して垂直に（90°で）押し当てる必要がある。",
    "tags": []
  },
  {
    "id": "r110-319",
    "year": 110,
    "question_number": 319,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 318−319       ₇₉ 歳男性。難治性の気管支ぜん息と診断され、吸入ステロイド薬及び長時\n間作用性気管支拡張薬による吸入療法を行っていた。しかし、効果不十分のため ₃\nケ月前よりメポリズマブ（遺伝子組換え）皮下注が追加され、院内処方にて病院で\n使用法の指導・確認を行っていた。今月より院外処方となり、薬局に処方 ₁ の処方\n箋を持って訪れた。薬剤師は、患者に練習用模擬ペンにて一連の操作をしてもら\nい、適切に使用できるか確認することとした。\nなお、この男性は、同一世帯に ₇₅ 歳の妻がおり、両者とも要支援・要介護認定\nは受けていない。この夫婦は年金受給者でその他の収入はなく、窓口負担割合が ₁\n割である。\n（処方 ₁ ：処方日 ₇ 月 ₁ 日）\nメポリズマブ（遺伝子組換え）皮下注（₁₀₀ mg/ ₁ キット）            ₁ キット\n（注）\n₁ 回 ₁₀₀ mg\n₄ 週間に ₁ 回    皮下注射（自己注射）\n（注）この薬剤 ₁ キットの薬価は約 ₁₆ 万円である。\n（皮下注ペンの構造と概要）\n薬液確認バー\n針キャップ\n（透明）\n安全カバー         薬液確認窓          使用前         使用後\n未使用の場合、\n薬液確認窓から\n薬液が見えます\n薬液注入後、薬液確認バーが\n左側に移動します\n穿刺用針は安全カバーに内蔵されており、針キャップを外し、安全カバーが見\nえなくなるまで穿刺部位にペン先を押し込むと、針が刺さり、薬液が注入され\nる構造となっている。\n問 319（法規・制度・倫理）\n問題なく自己注射ができると確認でき、医師に情報提供したところ、この薬剤を\n継続使用することとなった。その後、 ₇ 月 ₂₈ 日に受診し、その日に薬局に処方 ₁\nと同じ内容の処方箋を持って訪れた。この患者の医療費の自己負担に関する制度の\n内容として、適切なのはどれか。2つ選べ。\n1     半年（ ₆ ケ月）の自己負担額が一定金額を超えた場合、超過分が支給される。\n2     本制度が利用可能かの判断は、独立行政法人医薬品医療機器総合機構（PMDA）\nが行う。\n3     この患者への支給は国民健康保険組合が行う。\n4     本制度は、対象者の年齢の上限は設定されていない。\n5 同一世帯の妻が同じ医療保険に加入しているので、自己負担を合算して本制度\nを利用できる。",
    "choices": [
      {
        "key": 1,
        "text": "半年（ ₆ ケ月）の自己負担額が一定金額を超えた場合、超過分が支給される。"
      },
      {
        "key": 2,
        "text": "本制度が利用可能かの判断は、独立行政法人医薬品医療機器総合機構（PMDA） が行う。"
      },
      {
        "key": 3,
        "text": "この患者への支給は国民健康保険組合が行う。"
      },
      {
        "key": 4,
        "text": "本制度は、対象者の年齢の上限は設定されていない。"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q319.png"
  },
  {
    "id": "r110-320",
    "year": 110,
    "question_number": 320,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "69歳男性。一人暮らし。隣県に息子が住んでおり、休日にこの男性の世話をしている。処方1及び2の薬剤で治療していたが、物忘れが多くなり、2ヶ月前より処方3の薬剤が開始となった。服薬を忘れることもあり、息子は一人では面倒をみられないと近所の地域包括支援センターに相談し、要介護認定の申請を行い、今月要支援2の認定を受けた。主治医は、残薬が多く服薬に問題があるため、服薬支援のために薬局薬剤師の在宅訪問を考えた。この男性、息子、医師、薬剤師、介護支援専門員と相談の結果、薬剤師の月1回訪問が決まり、契約を締結し、薬剤管理指導の費用を介護保険で請求することとなった。初回訪問時の処方は以下のとおりである。\n問320（法規・制度・倫理）\n\n薬局薬剤師が薬剤管理指導を請求する保険の算定要件等に関する記述として、適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "在宅患者訪問薬剤管理指導料で請求する。"
      },
      {
        "key": 2,
        "text": "管理指導に携わる薬剤師は、5年以上の実務経験が求められる。"
      },
      {
        "key": 3,
        "text": "保険薬局の指定を受けていれば、この管理指導に関する実施について、あらためて届出をする必要はない。"
      },
      {
        "key": 4,
        "text": "1ヶ月に請求できる訪問回数に制限が設けられている。"
      },
      {
        "key": 5,
        "text": "訪問時に居宅サービスの変更につながる情報を得た場合でも、医師以外の関係者に報告する必要はない。"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\n本患者は、要支援2の認定を受けており、また、薬剤管理指導の費用を介護保険で請求するとなっていることから、介護予防居宅療養管理指導費を算定する。なお、医療保険により患者宅を訪問し指導を行なった場合には、在宅患者訪問薬剤管理指導料を請求する。\n\n２　誤\n\n薬剤師は、実務経験に関係なく、訪問薬剤管理指導を行うことができる。\n\n３　正\n\n保険薬局の指定を受けていれば、居宅サービス事業者（居宅療養管理指導又は介護予防居宅療養管理指導に係る指定事業所）とみなされる。\n\n４　正\n\n介護予防居宅管理指導は、月4回まで算定することができる（ただし、末期がんの患者、中心静脈栄養の患者は月8回まで算定することができる）。\n\n５　誤\n\n薬剤師が患者宅を訪問して指導を行った場合、医師に対して文書で報告を行う。また、居宅サービスの変更に関する情報を得た場合、介護支援専門員（ケアマネージャー）にも情報を提供する。",
    "tags": []
  },
  {
    "id": "r110-321",
    "year": 110,
    "question_number": 321,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 320−321      ₆₉ 歳男性。一人暮らし。隣県に息子が住んでおり、休日にこの男性の世話\nをしている。処方 ₁ 及び ₂ の薬剤で治療していたが、物忘れが多くなり、 ₂ ケ月前\nより処方 ₃ の薬剤が開始となった。服薬を忘れることもあり、息子は一人では面倒\nをみられないと近所の地域包括支援センターに相談し、要介護認定の申請を行い、\n今月要支援 ₂ の認定を受けた。主治医は、残薬が多く服薬に問題があるため、服薬\n支援のために薬局薬剤師の在宅訪問を考えた。この男性、息子、医師、薬剤師、介\n護支援専門員と相談の結果、薬剤師の月 ₁ 回訪問が決まり、契約を締結し、薬剤管\n理指導の費用を介護保険で請求することとなった。初回訪問時の処方は以下のとお\nりである。\n（処方 ₁ ）\nイミダプリル塩酸塩錠 ₅ mg            ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\nタムスロシン塩酸塩口腔内崩壊錠 ₀ . ₁ mg   ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₂₈ 日分\n（処方 ₂ ）\n酸化マグネシウム錠 ₃₃₀ mg           ₁ 回 ₂ 錠（ ₁ 日 ₆ 錠）\n₁日₃回    朝昼夕食後       ₂₈ 日分\n（処方 ₃ ）\nガランタミン口腔内崩壊錠 ₈ mg          ₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\nファモチジン口腔内崩壊錠 ₁₀ mg         ₁ 回 ₁ 錠（ ₁ 日 ₂ 錠）\n₁日₂回    朝夕食後    ₂₈ 日分\n問 321（実務）\n薬剤師が ₂ 回目の訪問時に患者宅にあるヘルパーの訪問記録から、薬がきちんと\n飲めているが、ここ ₁ ケ月ほど軟便が続いているという情報を得た。この患者に合\nわせた薬剤師の対応として最も適切なのはどれか。1つ選べ。\n1     水分摂取を控えるよう患者と息子に指導した。\n2     酸化マグネシウムの減量を主治医に提案した。\n3     市販の止瀉薬を購入し、服用するよう患者と息子に指導した。\n4     ファモチジンの増量を主治医に提案した。\n5     ガランタミンの増量を主治医に提案した。",
    "choices": [
      {
        "key": 1,
        "text": "水分摂取を控えるよう患者と息子に指導した。"
      },
      {
        "key": 2,
        "text": "酸化マグネシウムの減量を主治医に提案した。"
      },
      {
        "key": 3,
        "text": "市販の止瀉薬を購入し、服用するよう患者と息子に指導した。"
      },
      {
        "key": 4,
        "text": "ファモチジンの増量を主治医に提案した。"
      },
      {
        "key": 5,
        "text": "ガランタミンの増量を主治医に提案した。"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q321.png"
  },
  {
    "id": "r110-322",
    "year": 110,
    "question_number": 322,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "72歳男性。数年前よりA病院から処方1の薬剤が処方されていた。さらに、2週間前から処方2が開始された。本日、男性はかかりつけ薬局に電話し、3日前から腹部の不快感を感じているが治らないと訴えた。薬剤師は、男性よりここ数週間は食生活に大きな変化がないことを聴取した。また、処方1の薬剤が多く残っており、夕食後は飲み忘れてしまうことも分かった。対応については、折り返し電話する旨を伝えた。薬剤師は、この薬局で実務実習中の薬学部学生に、練習として電話で伝える指導内容案とA病院への服薬情報提供書案の作成を指示した。また処方1と処方2の薬剤の注意事項等情報(添付文書)を確認したところ、処方2の薬剤の副作用欄に「腹部不快感：0.5〜2%未満」と記載されていた。\n\n　なお、この薬局は地域連携薬局の認定を有していることを薬局内に掲示している。その他の薬局の認定は受けていない。\n問322（実務）\n\n指導薬剤師は、実務実習生の指導内容案と服薬情報提供書案を確認した。適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "指導内容案：処方2の薬剤の服用を直ちに中止すること"
      },
      {
        "key": 2,
        "text": "指導内容案：残薬は薬局で対応できないので医師に相談すること"
      },
      {
        "key": 3,
        "text": "情報提供書案：処方1の薬剤について1日1回朝食後に変更の提案をすること"
      },
      {
        "key": 4,
        "text": "情報提供書案：処方1の薬剤の副作用発現の可能性が高いこと"
      },
      {
        "key": 5,
        "text": "情報提供書案：処方2の薬剤の副作用発現の可能性が高いこと"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\n薬剤師が副作用の可能性を疑ったとしても、処方された薬剤の中止を薬剤師の判断で指示することはできない。副作用の可能性が疑われる場合、処方医に連絡するとともに、患者に受診するよう促す必要がある。\n\n２　誤\n\n薬局で残薬調整を行うことが可能である。薬剤師が残薬を確認した場合、その情報を医師に伝え、処方日数の変更等について処方医に同意をもらう必要がある。また、医師から「残薬調整の可否」についてあらかじめ包括的な同意がある場合や処方箋備考欄に「残薬調整可」等の記載があれば、処方日数を減らして調剤することが可能である。\n\n３　正\n\n処方1のロバスタチンは夕食後の服用となっているが、夕食後の服用を忘れてしまう傾向にあることから、服薬アドヒアランスの観点より規則的な服用が可能な時間帯への変更を提案することは適切である。患者は朝食後にすでに処方2を服用しており、服薬時間を朝食後に統一することで、服薬の継続性向上が期待される。\n\n４　誤\n\n処方1は残薬が多く、飲み忘れていることが多いため、処方1による副作用が発現している可能性は低い。\n\n５　正\n\n処方２が開始された後、腹部不快感を感じていること",
    "tags": []
  },
  {
    "id": "r110-323",
    "year": 110,
    "question_number": 323,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 322−323      ₇₂ 歳男性。数年前よりＡ病院から処方 ₁ の薬剤が処方されていた。さら\nに、 ₂ 週間前から処方 ₂ が開始された。本日、男性はかかりつけ薬局に電話し、\n₃ 日前から腹部の不快感を感じているが治らないと訴えた。薬剤師は、男性よりこ\nこ数週間は食生活に大きな変化がないことを聴取した。また、処方 ₁ の薬剤が多く\n残っており、夕食後は飲み忘れてしまうことも分かった。対応については、折り返\nし電話する旨を伝えた。薬剤師は、この薬局で実務実習中の薬学部学生に、練習と\nして電話で伝える指導内容案とＡ病院への服薬情報提供書案の作成を指示した。ま\nた、処方 ₁ と処方 ₂ の薬剤の注意事項等情報（添付文書）を確認したところ、処方\n₂ の薬剤の副作用欄に「腹部不快感         ₀ . ₅～ ₂ ％未満」と記載されていた。\nなお、この薬局は地域連携薬局の認定を有していることを薬局内に掲示してい\nる。その他の薬局の認定は受けていない。\n（処方 ₁ ）\nロスバスタチン錠 ₂ . ₅ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    夕食後    ₃₀ 日分\n（処方 ₂ ）\nサキサグリプチン水和物錠 ₅ mg    ₁ 回 ₁ 錠（ ₁ 日 ₁ 錠）\n₁日₁回    朝食後    ₃₀ 日分\n問 323（法規・制度・倫理）\n薬剤師は、実務実習生に、この薬局が掲示している認定に関する条件や特徴につ\nいて質問した。学生の回答のうち、適切なのはどれか。2つ選べ。\n1 患者さんのご自宅での訪問指導に関する薬局の実績の有無に関わらず、訪問指\n導の依頼にすぐに対応できる体制を整えている必要があります。\n2     現在の薬局の所在地で、₁₀ 年以上営業を続けている必要があります。\n3     オンライン服薬指導に対応できる体制を整えている必要があります。\n4     地域包括ケアシステムに関する研修を修了した薬剤師が常勤している必要があ\nります。\n5 患者さんが入退院した時は、医療機関と連携して服薬情報などをやり取りでき\nる体制を整えている必要があります。",
    "choices": [
      {
        "key": 1,
        "text": "現在の薬局の所在地で、₁₀ 年以上営業を続けている必要があります。"
      },
      {
        "key": 2,
        "text": "オンライン服薬指導に対応できる体制を整えている必要があります。"
      },
      {
        "key": 3,
        "text": "地域包括ケアシステムに関する研修を修了した薬剤師が常勤している必要があ ります。"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q323.png"
  },
  {
    "id": "r110-324",
    "year": 110,
    "question_number": 324,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "ある薬局で、服薬指導の内容と服薬アドヒアランスとの関係を明らかにするために、この薬局で過去5年間に降圧薬を調剤された成人患者を対象として、薬歴を用いて後ろ向きに調査を行い、学会発表することを計画している。研究に用いるデータは、患者名はわからないように集計、解析する予定である。調査対象となる患者全員に個別に説明し同意を取得するのは困難なので、研究概要の薬局内へのポスター掲示と薬局ホームページへの掲載によりいつでも質問を受け付けることができるようにすることで、倫理審査委員会の承認を受ける予定である。なお、この研究にかかる費用はこの薬局で負担することとした。\n問324（実務）\n\nこの薬局で研究のために作成するポスターに記載する内容として必要なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "研究目的"
      },
      {
        "key": 2,
        "text": "研究協力の拒否の方法"
      },
      {
        "key": 3,
        "text": "研究に携わっている全員の連絡先"
      },
      {
        "key": 4,
        "text": "倫理審査委員会の委員の氏名"
      },
      {
        "key": 5,
        "text": "この研究に要する費用"
      }
    ],
    "correct_answer": 1,
    "explanation": "本設問は、薬局で実施予定の後ろ向き研究に関して、ポスター掲示によって研究対象者に情報を提供する、いわゆるオプトアウト方式に関する設問である。オプトアウト方式とは、匿名化された既存情報を用いた研究において、個別に同意を得ることが困難な場合に、研究対象者が参加を拒否できるよう機会を提供する手段である。この場合、厚生労働省の「人を対象とする生命科学・医学系研究に関する倫理指針」に基づき、研究対象者等に通知または公開すべき事項が定められており、ポスターにも以下のような内容を明記する必要がある。\n\n①：研究目的\n\n研究対象者に対し、どのような目的で自身の情報が利用されるのかを明示することは、研究の透明性を確保し、研究への信頼を高める上でも不可欠である。\n\n②：研究協力の拒否の方法\n\nオプトアウト方式を採用する場合には、研究に協力したくない対象者がその意思を示す手段を必ず確保しなければならない。\n\nなお、選択肢3の「研究に携わっている全員の連絡先」や、選択肢4の「倫理審査委員会の委員の氏名」は、倫理指針においてポスター掲示に求められている情報ではない。また、選択肢5の「この研究に要する費用」は、研",
    "tags": []
  },
  {
    "id": "r110-325",
    "year": 110,
    "question_number": 325,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 324−325      ある薬局で、服薬指導の内容と服薬アドヒアランスとの関係を明らかにす\nるために、この薬局で過去 ₅ 年間に降圧薬を調剤された成人患者を対象として、薬\n歴を用いて後ろ向きに調査を行い、学会発表することを計画している。研究に用い\nるデータは、患者名はわからないように集計、解析する予定である。\n調査対象となる患者全員に個別に説明し同意を取得するのは困難なので、研究概\n要の薬局内へのポスター掲示と薬局ホームページへの掲載によりいつでも質問を受\nけ付けることができるようにすることで、倫理審査委員会の承認を受ける予定であ\nる。なお、この研究にかかる費用はこの薬局で負担することとした。\n問 325（法規・制度・倫理）\n当該研究に関して倫理審査委員会に提出する申請書類を作成する際に、遵守する\nことが求められるのはどれか。1つ選べ。\n1     医薬品の臨床試験の実施の基準に関する省令\n2     人を対象とする生命科学・医学系研究に関する倫理指針\n3     医薬品の安全性に関する非臨床試験の実施の基準に関する省令\n4     日本薬局方\n5     臨床研究法\n一般問題（薬学実践問題）【実務】",
    "choices": [
      {
        "key": 1,
        "text": "医薬品の臨床試験の実施の基準に関する省令"
      },
      {
        "key": 2,
        "text": "人を対象とする生命科学・医学系研究に関する倫理指針"
      },
      {
        "key": 3,
        "text": "医薬品の安全性に関する非臨床試験の実施の基準に関する省令"
      },
      {
        "key": 4,
        "text": "日本薬局方"
      },
      {
        "key": 5,
        "text": "臨床研究法"
      }
    ],
    "correct_answer": 2,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q325.png"
  },
  {
    "id": "r110-326",
    "year": 110,
    "question_number": 326,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "40歳男性。身長172cm、体重70kg。今回、生体腎移植を受けるために入院した。移植後の拒絶反応予防のために、以下の処方が開始された。\n服薬開始後10日目の服薬指導時、薬剤師に下痢の訴えがあった。\n\n訴えに対する薬剤師の薬学的管理事項として、誤っているのはどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "口の渇き、尿量の変化を確認"
      },
      {
        "key": 2,
        "text": "ミコフェノール酸モフェチルの血中濃度測定依頼を提案"
      },
      {
        "key": 3,
        "text": "メチルプレドニゾロン錠の中止を提案"
      },
      {
        "key": 4,
        "text": "症状軽減のために半夏瀉心湯エキス顆粒の処方提案"
      },
      {
        "key": 5,
        "text": "感染症確認のために便培養依頼を提案"
      }
    ],
    "correct_answer": 3,
    "explanation": "本設問では、服薬開始後10日目に患者から下痢の訴えがあり、服用中のミコフェノール酸モフェチル（MMF）には重度の下痢を含む消化器系の副作用が知られていることから、本例の下痢はMMFによる副作用である可能性が高いと考えられる。\n\n１　正しい\n\n　ミコフェノール酸モフェチルでは、脱水を伴う重度の下痢が報告されており、口渇や尿量の変化の確認は、脱水の早期発見のために重要である。\n\n２　正しい\n\n　ミコフェノール酸モフェチルの副作用として下痢が発現している可能性があるため、血中濃度測定を依頼することは適切である。\n\n３　誤っている\n\n　下痢の原因がミコフェノール酸モフェチルである可能性が高いと考えられるため、メチルプレドニゾロン錠（ステロイド）の中止を提案するのは不適切である。\n\n４　正しい\n\n　MMFは腸管内でミコフェノール酸に変換され、その代謝産物が下痢の原因となることがある。半夏瀉心湯は、MMFからミコフェノール酸の生成を抑えることで下痢を軽減する効果が期待されるため、処方提案は適切である。\n\n５　正しい\n\n　ミコフェノール酸モフェチルなどの免疫抑制薬使用中は、感染性腸炎による下痢も起こ",
    "tags": []
  },
  {
    "id": "r110-327",
    "year": 110,
    "question_number": 327,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "68歳女性。夕方買い物に出かけた際に転倒し、救急車で整形外科病院に搬送された。\n下半身の痛みを訴えており、自力で立つことができない状態であった。レントゲン検査の結果、大腿骨頸部骨折と診断され、緊急で骨接合術が実施されることになった。主治医よりこの患者の服薬状況について、確認依頼があった。そこで薬剤師は、患者が携帯していたお薬手帳より、現在の内服薬の情報を入手した。\n術後、完全に歩行可能になるまで服用を中止すべき内服薬はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "エルデカルシトールカプセル"
      },
      {
        "key": 2,
        "text": "ラロキシフェン塩酸塩錠"
      },
      {
        "key": 3,
        "text": "アムロジピン錠"
      },
      {
        "key": 4,
        "text": "ロスバスタチン錠"
      },
      {
        "key": 5,
        "text": "スボレキサント錠"
      }
    ],
    "correct_answer": 2,
    "explanation": "術後の長期安静により、静脈血栓塞栓症（VTE）のリスクが高まるため、ラロキシフェン塩酸塩は、術前に中止する必要がある。ラロキシフェンは、SERM（選択的エストロゲン受容体調整薬）に分類される骨粗鬆症治療薬であり、深部静脈血栓症や肺塞栓症などのリスクを増加させることが知られている。特に、長期間にわたり体を動かさない状態（術後の安静期など）では、血栓形成のリスクがさらに上昇する。そのため、ラロキシフェン塩酸塩は、長期不動状態に入る3日前から服用を中止し、完全に歩行可能になるまでは再開しないことが推奨されている。",
    "tags": []
  },
  {
    "id": "r110-328",
    "year": 110,
    "question_number": 328,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "5歳男児。37°Cの微熱と咽頭痛があり、近医を受診したが、翌日に39.2°Cまで上昇し、眼球結膜の充血及び全身に赤い発疹が出現したために近医より大学病院を紹介され受診した。心臓超音波検査の結果、右冠動脈径4.1mmと拡大を認め、川崎病と診断された。入院後より大量免疫グロブリン静注療法とアスピリンの内服を開始した。翌日には解熱し、1週間後にほぼ症状は消失した。心臓超音波検査で右冠動脈径3.8mmと縮小傾向を確認し、2週間後に退院となった。アスピリンは退院後も継続処方となっている。\n薬剤師が退院時に患者家族へ伝える内容として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "免疫グロブリン静注療法は、退院後も定期的に実施する必要がある。"
      },
      {
        "key": 2,
        "text": "アスピリンは、退院後も血栓予防のために服用することが重要である。"
      },
      {
        "key": 3,
        "text": "アスピリンは、入院中と同じ用法・用量で服用する。"
      },
      {
        "key": 4,
        "text": "アスピリン服用中に、インフルエンザと診断された場合には、すぐに主治医に連絡する。"
      },
      {
        "key": 5,
        "text": "麻しん風しんワクチンは、退院後速やかに接種しても差し支えない。"
      }
    ],
    "correct_answer": 2,
    "explanation": "川崎病は、主に乳幼児に発症する原因不明の全身性血管炎であり、冠動脈瘤などの重篤な心血管合併症を引き起こすことがある。急性期治療では、炎症の早期終息と冠動脈病変の予防が重要であり、免疫グロブリン製剤の静注療法およびアスピリン内服療法が行われる。\n\n１　誤\n\n免疫グロブリン静注療法は、急性期に実施される治療であり、退院後に定期的に繰り返す必要はない。\n\n２　正\n\n川崎病の発症後数か月間は血小板凝集能が亢進しており、退院後も冠動脈病変の予防のためアスピリンを継続服用することが重要である。\n\n３　誤\n\nアスピリンは、急性期の有熱期には抗炎症目的で中等量を投与するが、解熱後〜慢性期には、抗血小板作用を目的とした低用量に変更される。したがって、退院後に入院中と同じ用法・用量で継続するのは不適切である。\n\n４　正\n\nアスピリン服用中に15歳未満でインフルエンザを発症した場合、ライ症候群（急性脳症と肝障害）の発症リスクがある。そのため、インフルエンザと診断された場合はすぐに主治医に連絡し、アスピリンの継続可否について判断を仰ぐ必要がある。\n\n５　誤\n\n免疫グロブリン静注後は、生ワクチンの効果が低下する",
    "tags": []
  },
  {
    "id": "r110-329",
    "year": 110,
    "question_number": 329,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 329        医薬品とサプリメント含有成分による相互作用の組合せのうち、誤っているの\nはどれか。1つ選べ。\n医薬品（本剤）    ―       サプリメント含有成分       相互作用\n本剤の作用が減弱\n1   レボドパ・カルビドパ   ―   鉄\nするおそれがある\nセロトニン作用に\n2   パロキセチン       ―   セント・ジョーンズワート     よる症状が現れる\nことがある。\n本剤の吸収が促進\n3   アレンドロン酸      ―   カルシウム            されるおそれがあ\nる\n本剤の効果が減弱\n4   レボフロキサシン     ―   マグネシウム\nするおそれがある\n過度の中枢神経刺\n5   アミノフィリン      ―   カフェイン            激作用が現れるこ\nとがある",
    "choices": [
      {
        "key": 1,
        "text": "レボドパ・カルビドパ   ―   鉄 するおそれがある セロトニン作用に"
      },
      {
        "key": 2,
        "text": "パロキセチン       ―   セント・ジョーンズワート     よる症状が現れる ことがある。 本剤の吸収が促進"
      },
      {
        "key": 3,
        "text": "アレンドロン酸      ―   カルシウム            されるおそれがあ"
      },
      {
        "key": 4,
        "text": "レボフロキサシン     ―   マグネシウム するおそれがある 過度の中枢神経刺"
      },
      {
        "key": 5,
        "text": "アミノフィリン      ―   カフェイン            激作用が現れるこ とがある"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-330",
    "year": 110,
    "question_number": 330,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "52歳女性。非小細胞肺がん。以下の処方箋を持ってかかりつけ薬局を訪れた。\n薬歴の内容から以下の薬剤が3週毎に処方されていた。\n患者の今回の処方と薬歴情報から、薬物治療に対する評価と指導計画について適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "今回の処方薬は、化学療法施行後に開始された薬剤である。"
      },
      {
        "key": 2,
        "text": "血小板減少による発熱が出現していた可能性がある。"
      },
      {
        "key": 3,
        "text": "下痢症状が出現しても自然に治まることを伝える。"
      },
      {
        "key": 4,
        "text": "発疹、皮膚の乾燥やかゆみが出現する可能性があることを伝える。"
      },
      {
        "key": 5,
        "text": "服用忘れに気づいた日は、翌日の決められた時間に2回分を服用することを伝える。"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　誤\n\n薬歴にはジフェンヒドラミン塩酸塩、レボフロキサシン、ロキソプロフェンが3週毎に処方されており、これらは一般的に抗がん剤治療に伴う副作用（過敏症状や発熱、感染症）への対症療法であると考えられる。一方、今回の処方薬「アファチニブ」はEGFR遺伝子変異陽性非小細胞肺がんに対する分子標的治療薬であり、抗がん剤治療の後に導入されることが多い薬剤である。\n\n２　誤\n\n化学療法による発熱は、骨髄抑制に伴う白血球減少による感染性発熱（好中球減少性発熱）が典型である。血小板減少は出血傾向を引き起こすが、発熱の直接的原因とはなりにくい。\n\n３　誤\n\nアファチニブはEGFRチロシンキナーゼ阻害薬であり、副作用として重度の水様性下痢を発現する。下痢を放置すると脱水や電解質異常を引き起こすおそれがあるため、早期にロペラミドなどの止痢薬を使用し、必要に応じて医療機関の受診を促すことが重要である。\n\n４　正\n\nアファチニブを含むEGFRチロシンキナーゼ阻害薬では、皮膚障害（発疹、ざ瘡様皮疹、乾燥、掻痒など）が非常に高頻度で出現する。これらの皮膚障害は早期対処により重症化を防ぐことができるため、事前の患者指",
    "tags": []
  },
  {
    "id": "r110-331",
    "year": 110,
    "question_number": 331,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "68歳男性。身長174cm、体重93kg。既往歴として高血圧、脂質異常症、心房細動。薬物アレルギー歴無し。12時頃、ゴルフ中に突然倒れた。救急隊到着時、本人から発語は見られていたが、次第に会話が困難になった。救急搬送時(14時)、頭部MRIで左中大動脈領域に梗塞巣を認め、各種所見から心原性脳梗塞と診断された。また大動脈解離、急性膵炎は否定され、その他心弁膜症、臓器出血の合併は認められなかった。\n救急担当薬剤師が今後の治療について医師との共有事項として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ヘパリンナトリウムの静脈内投与による急性期治療"
      },
      {
        "key": 2,
        "text": "予後改善効果を目的とした急性期におけるエダラボン投与"
      },
      {
        "key": 3,
        "text": "脳浮腫が出現した場合のトルバプタン投与"
      },
      {
        "key": 4,
        "text": "発症早期における新たな血栓防止のための抗血小板療法の開始"
      },
      {
        "key": 5,
        "text": "急性期におけるDOAC（直接阻害型経口抗凝固薬）の使用"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nヘパリンは、急性期の脳梗塞において、脳塞栓症や血栓形成の進展を防ぐ目的で使用される。特に心原性脳塞栓症では再塞栓のリスクが高いため、発症からの経過時間や出血リスクを考慮したうえで、ヘパリンなどの抗凝固薬による急性期治療が推奨される。\n\n２　正\n\nエダラボンは、脳梗塞の急性期においてフリーラジカルを除去し、神経細胞死を抑制する作用があり、日常生活動作（ADL）の改善に寄与する。発症後24時間以内に投与が開始される必要があるが、本症例は発症から搬送まで2時間以内であるため、エダラボンを投与することは適切である。\n\n３　誤\n\nトルバプタンは、バソプレシンV2受容体拮抗薬であり、心不全や肝硬変における体液貯留の治療に用いられる。脳浮腫に対してはマンニトールなど浸透圧利尿薬が用いられ、トルバプタンは適応外であり、電解質異常や血栓塞栓のリスクがあるため不適切である。\n\n４　誤\n\n心原性脳塞栓症では、血栓の主因が心房内で形成されたフィブリンリッチな赤色血栓であり、抗凝固薬の使用が原則である。抗血小板薬はアテローム血栓性脳梗塞などが適応であり、心房細動に起因する脳梗塞に対しては用いられない。",
    "tags": []
  },
  {
    "id": "r110-332",
    "year": 110,
    "question_number": 332,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "24歳女性。陸上競技者。日本で行われる国際大会に出場予定であるが、大会出場の重圧で鼻詰まり症状が出たり、おなかの調子が悪くなることがあった。そのためこの女性は明日から始まる大会に向けて所属チームのスポーツファーマシストに一般用医薬品の購入について相談した。この女性に推奨できる一般用医薬品に含まれる成分はどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ブチルスコポラミン臭化物"
      },
      {
        "key": 2,
        "text": "ホミカ"
      },
      {
        "key": 3,
        "text": "マオウ"
      },
      {
        "key": 4,
        "text": "ロラタジン"
      },
      {
        "key": 5,
        "text": "プソイドエフェドリン"
      }
    ],
    "correct_answer": 1,
    "explanation": "１　正\n\nブチルスコポラミンは、抗コリン作用をもつ鎮痙薬（胃腸薬）であり、世界アンチ・ドーピング機構（WADA）の禁止物質には該当しない。そのため、本選手に推奨可能である。\n\n２　誤\n\nホミカにはストリキニーネ（強い中枢神経興奮作用を有するアルカロイド）が含まれており、WADAが競技会時に禁止する「特定物質である興奮薬」に分類される。よって、本選手には推奨できない。\n\n３　誤\n\nマオウにはエフェドリン類（交感神経興奮薬）が含まれており、WADAが競技会時に禁止する「特定物質である興奮薬」に該当する。したがって、本選手には推奨されない。\n\n４　正\n\nロラタジンは、第二世代抗ヒスタミン薬（H₁受容体拮抗薬）で、鼻閉やくしゃみなどのアレルギー症状に対して使用される。WADAの禁止物質には該当せず、本選手に安全に使用可能である。\n\n５　誤\n\nプソイドエフェドリンは、交感神経刺激作用を有し、WADAが競技会時に禁止する「特定物質である興奮薬」に分類される。よって、本選手には推奨できない。",
    "tags": []
  },
  {
    "id": "r110-333",
    "year": 110,
    "question_number": 333,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "60歳男性。がん化学療法後に増悪したPD-L1陽性の再発食道扁平上皮がんに対してペムブロリズマブ200mgの点滴静注が開始された。4コース目施行時に担当薬剤師は患者から3コース終了頃から倦怠感と寒気が続いているとの訴えを聴取した。また看護記録から体重増加と心拍42拍/分で徐脈であることを確認した。担当薬剤師は以下の医薬品リスク管理計画を参考に有害事象発現の可能性を考えた。身体所見と看護記録に基づいて薬剤師から提案する検査項目はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "プロラクチン"
      },
      {
        "key": 2,
        "text": "テストステロン"
      },
      {
        "key": 3,
        "text": "抗利尿ホルモン"
      },
      {
        "key": 4,
        "text": "ゴナドトロピン"
      },
      {
        "key": 5,
        "text": "甲状腺刺激ホルモン"
      }
    ],
    "correct_answer": 5,
    "explanation": "ペムブロリズマブは、免疫チェックポイント阻害薬（PD-1阻害薬）であり、T細胞によるがん細胞への攻撃を促進する一方で、免疫が過剰に働くことで正常組織に対しても免疫反応を引き起こし、副作用が生じることがある。これらの副作用は自己免疫疾患に類似した症状を呈し、「免疫関連有害事象」と呼ばれている。\n\n代表的な免疫関連有害事象には以下がある\n\n・間質性肺炎\n\n・重度の下痢・大腸炎\n\n・甲状腺機能障害\n\n・副腎機能低下\n\n・1型糖尿病\n\n・筋炎、重症筋無力症\n\n本症例では、倦怠感、寒気、体重増加、心拍数42拍/分と徐脈が確認されており、これは典型的な甲状腺機能低下症の症状である。甲状腺ホルモン（T3、T4）の低下により、負のフィードバック機構が働き、甲状腺刺激ホルモン（TSH）の上昇が認められる。そのため、薬剤師が提案すべき検査項目としてTSHの測定が適切である。",
    "tags": []
  },
  {
    "id": "r110-334",
    "year": 110,
    "question_number": 334,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "68歳女性。1週間前より右下肢に腫脹が見られるようになり、かかりつけ医から大学病院を紹介され、受診した。下肢静脈超音波検査による血栓の確認及びD-ダイマーの上昇により、深部静脈血栓症と診断され、即日入院となった。薬剤師は、患者が携帯していたお薬手帳より、現在の使用中の薬剤情報を入手した。また、入院後も服用継続の予定である。\nこの患者に適切な深部静脈血栓症の治療薬はどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "シロスタゾール"
      },
      {
        "key": 2,
        "text": "クロピドグレル"
      },
      {
        "key": 3,
        "text": "ワルファリンカリウム"
      },
      {
        "key": 4,
        "text": "アピキサバン"
      },
      {
        "key": 5,
        "text": "ダルテパリン"
      }
    ],
    "correct_answer": 4,
    "explanation": "深部静脈血栓症（DVT）は、下肢の静脈に血栓が形成される疾患であり、肺塞栓症をはじめとする重篤な合併症のリスクがある。そのため、血栓の進展や再発を防ぐ目的で、抗凝固薬（血液凝固阻害薬）による治療が推奨される。\n\n１　誤\n\nシロスタゾールは、ホスホジエステラーゼⅢ阻害薬であり、抗血小板作用を示すため、脳梗塞や閉塞性動脈硬化症などで用いられるが、DVTには用いられない。\n\n２　誤\n\nクロピドグレルは、ADP受容体（P2Y12）阻害薬であり、抗血小板作用を示すため、脳梗塞や虚血性心疾患に用いられるが、DVTには用いられない。\n\n３　誤\n\nワルファリンカリウムは、抗凝固薬であり、DVTの治療に用いられる。しかし、ミコナゾールはCYP2C9阻害作用が強く、ワルファリンの代謝を阻害し、出血リスクを増加させる。そのため、両剤は併用禁忌であり、本症例には適さない。\n\n４　正\n\nアピキサバンは、直接Xa因子阻害薬であり、DVTの治療に用いられる。ミコナゾールとの併用により血中濃度の上昇が懸念されるが、有益性がリスクを上回ると判断される場合には慎重な併用が可能である。\n\n５　正\n\nダルテパリンは、低分子ヘ",
    "tags": []
  },
  {
    "id": "r110-335",
    "year": 110,
    "question_number": 335,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "63歳男性。数日前より全身倦怠感があり、血圧低下、体重減少が出現したため近医を受診し、大学病院を紹介された。外観上皮膚の色素沈着が認められた。検査の結果、コルチゾールの低値及びACTHの高値が認められ、アジソン病の確定診断を受け、以下の処方が開始となった。\nしかし、投薬開始後、低血圧及び低Na血症の改善が不十分であり、処方に追加する治療薬の検討が必要となった。\n\n　この患者に追加する最も適切な治療薬はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "デキサメタゾン"
      },
      {
        "key": 2,
        "text": "ベタメタゾン"
      },
      {
        "key": 3,
        "text": "フルドロコルチゾン"
      },
      {
        "key": 4,
        "text": "スピロノラクトン"
      },
      {
        "key": 5,
        "text": "エプレレノン"
      }
    ],
    "correct_answer": 3,
    "explanation": "アジソン病は、副腎皮質ホルモン（糖質コルチコイドおよび鉱質コルチコイド）の分泌低下により生じる疾患である。糖質コルチコイドの不足による症状には倦怠感、低血糖、体重減少などがあり、鉱質コルチコイドの不足により低Na血症、脱水、血圧低下、高K血症などがみられる。これに伴い、負のフィードバックによりACTHが高値となる。\n\n本症例では、糖質コルチコイドとしてヒドロコルチゾンが導入されているが、低Na血症および低血圧が改善しないことから、鉱質コルチコイドの補充が不十分であると考えられる。\n\n１　誤\n\nデキサメタゾンは、強力な糖質コルチコイドであり、鉱質コルチコイド作用はほとんど示さないため、追加薬としては不適切である。\n\n２　誤\n\nベタメタゾンは、強力な糖質コルチコイドであり、鉱質コルチコイド作用はほとんど示さないため、追加薬としては不適切である。\n\n３　正\n\nフルドロコルチゾンは、鉱質コルチコイド作用を有するため、低Na血症・高K血症・低血圧を是正する目的で追加することは適切である。\n\n４　誤\n\nスピロノラクトンは、抗アルドステロン薬であり、高K血症を悪化させる可能性があるため、追加薬として",
    "tags": []
  },
  {
    "id": "r110-336",
    "year": 110,
    "question_number": 336,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 336        粉砕又は脱カプセルを避けるべき薬剤とその理由として正しいのはどれか。\n2つ選べ。\n薬剤                理由\nダビガトランエテキシラートメタン     放出制御製剤であるため\nスルホン酸塩カプセル\n2   ポマリドミドカプセル           光で分解するため\n3   バルプロ酸ナトリウム錠          苦味が出るため\n4   ラベプラゾールナトリウム錠        腸溶錠であるため\n5   リセドロン酸ナトリウム錠         口腔咽頭刺激があるため",
    "choices": [
      {
        "key": 1,
        "text": "ポマリドミドカプセル           光で分解するため"
      },
      {
        "key": 2,
        "text": "バルプロ酸ナトリウム錠          苦味が出るため"
      },
      {
        "key": 3,
        "text": "ラベプラゾールナトリウム錠        腸溶錠であるため"
      },
      {
        "key": 4,
        "text": "リセドロン酸ナトリウム錠         口腔咽頭刺激があるため"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": [],
    "image_url": "/images/questions/110/q336.png"
  },
  {
    "id": "r110-337",
    "year": 110,
    "question_number": 337,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "67歳女性。身長163cm、体重62kg。乳がんの術後化学療法としてペルツズマブ、トラスツズマブ、ドセタキセルによる化学療法を施行している。外来日の検査値の結果を踏まえ、医師はペグフィルグラスチム（遺伝子組換え）の投与を行った。また患者は即時入院となった。この患者に使用する抗菌薬として適切なのはどれか。2つ選べ。\n（検査値）\n\n体温 38.1°C、好中球数 450/μL、eGFR 72.5mL/min/1.73m2",
    "choices": [
      {
        "key": 1,
        "text": "セフェピム"
      },
      {
        "key": 2,
        "text": "エリスロマイシン"
      },
      {
        "key": 3,
        "text": "メロペネム"
      },
      {
        "key": 4,
        "text": "ミノサイクリン"
      },
      {
        "key": 5,
        "text": "ダプトマイシン"
      }
    ],
    "correct_answer": 1,
    "explanation": "本症例では、好中球数が450/μL（500/μL未満）かつ体温38.1°C（37.5°C以上）であり、さらにG-CSF製剤（ペグフィルグラスチム）も使用中であることから、発熱性好中球減少症（FN：Febrile Neutropenia）と推察される。FNは緊急対応が必要な感染症リスク病態であり、原則として緑膿菌を含むグラム陰性桿菌に広く有効な抗菌薬（例：セフェピム、メロペネムなど）を速やかに投与する必要がある。",
    "tags": []
  },
  {
    "id": "r110-338",
    "year": 110,
    "question_number": 338,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 338        手袋を外す時の手技について、感染対策上、誤っているのはどれか。1つ選\nべ。ただし、手袋の外側を濃い色で、内側を薄い色で示している。\n1     手袋の外側の手首のあたりを反対の手でつまむ。\n2     手袋を中表にして外し、まだ手袋を着用している手で外した手袋を持ってお\nく。\n3     素手になった手で反対側の手袋の外側をつまむ。\n4     手袋を引き上げるように裏返しにして外していく。\n5     外した後、 ₂ 枚の手袋をひとかたまりになった状態で廃棄し、速乾性手指消毒\n剤で手指消毒を行う。",
    "choices": [
      {
        "key": 1,
        "text": "手袋の外側の手首のあたりを反対の手でつまむ。"
      },
      {
        "key": 2,
        "text": "手袋を中表にして外し、まだ手袋を着用している手で外した手袋を持ってお く。"
      },
      {
        "key": 3,
        "text": "素手になった手で反対側の手袋の外側をつまむ。"
      },
      {
        "key": 4,
        "text": "手袋を引き上げるように裏返しにして外していく。"
      },
      {
        "key": 5,
        "text": "外した後、 ₂ 枚の手袋をひとかたまりになった状態で廃棄し、速乾性手指消毒 剤で手指消毒を行う。"
      }
    ],
    "correct_answer": 3,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-339",
    "year": 110,
    "question_number": 339,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "問 339        院内において、病棟で使用するネブライザーの消毒用の次亜塩素酸ナトリウム\nの調製を薬剤部で行い、払い出すこととなった。次亜塩素酸ナトリウム濃度 ₆ ％の\n消毒薬を購入し、₀ . ₀₁％（₁₀₀ ppm）に調製して ₁ L のボトルで払い出すこととし\nた。このとき、原液            ア   に水を加え全量を      イ   とし、この液   ウ   を採取\nし、これに水を加えて全量を ₁ L とした。容量の組合せとして正しいのはどれか。\n1つ選べ。\nア        イ         ウ\n1    ₅₀ mL    ₁L       ₁₀₀ mL\n2    ₃₀ mL   ₃₀₀ mL     ₅₀ mL\n3    ₁₀ mL   ₂₀₀ mL     ₁₀ mL\n4    ₅ mL    ₃₀₀ mL    ₁₀₀ mL\n5    ₅ mL    ₁.₅ L      ₅₀ mL",
    "choices": [
      {
        "key": 1,
        "text": "₅₀ mL    ₁L       ₁₀₀ mL"
      },
      {
        "key": 2,
        "text": "₃₀ mL   ₃₀₀ mL     ₅₀ mL"
      },
      {
        "key": 3,
        "text": "₁₀ mL   ₂₀₀ mL     ₁₀ mL"
      },
      {
        "key": 4,
        "text": "₅ mL    ₃₀₀ mL    ₁₀₀ mL"
      },
      {
        "key": 5,
        "text": "₅ mL    ₁.₅ L      ₅₀ mL"
      }
    ],
    "correct_answer": 4,
    "explanation": "",
    "tags": []
  },
  {
    "id": "r110-340",
    "year": 110,
    "question_number": 340,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "65歳男性。身長178cm、体重75kg。食道がんの術前・術後の栄養管理に栄養サポートチーム（NST）が介入することになった。術前においては、本患者の食道に通過障害はあるものの、水分摂取は可能で食道以外に障害はなかった。術後においても、水分摂取は可能であった。この患者に対する栄養療法に関する記述として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "術前の栄養管理は、経腸栄養療法は実施できない。"
      },
      {
        "key": 2,
        "text": "術後の栄養管理には、経腸栄養療法が適している。"
      },
      {
        "key": 3,
        "text": "末梢静脈栄養療法では1日で必要な糖質量を摂取できる。"
      },
      {
        "key": 4,
        "text": "経腸栄養剤としては、消化態栄養剤よりも半消化態栄養剤の方が適している。"
      },
      {
        "key": 5,
        "text": "経腸栄養療法よりも中心静脈栄養療法の方が感染性リスクは少ない。"
      }
    ],
    "correct_answer": 2,
    "explanation": "本患者は「水分摂取は可能で食道以外に障害はない」と記載されていることから、消化管機能は保持されていると判断でき、経腸栄養療法の実施が可能である。\n\n１　誤\n\n術前も「水分摂取は可能で食道以外に障害はない」と記載されており、消化管は使用可能であるため、経腸栄養療法は実施可能である。\n\n２　正\n\n術後も水分摂取が可能であることから、消化管機能が保たれていれば経腸栄養療法が第一選択となる。\n\n３　誤\n\n末梢静脈栄養では、浸透圧や投与量に制限があり、1日あたり1,000～1,200kcal程度の補給が限界とされており、糖質を十分に補給することはできない。\n\n４　正\n\n本症例のように、消化管の機能が保たれており水分摂取も可能な患者では、経腸栄養法の選択が可能である。しかし、術後や高齢による軽度の消化機能低下が想定される場合、消化態栄養剤のように消化酵素による分解を必要とする製剤では、腸管への負担が大きくなり、下痢や嘔吐などの副作用を生じるリスクがある。その点、半消化態栄養剤は、ペプチドや中鎖脂肪酸（MCT）などを含み、消化吸収効率が高く、身体への負担が少ないという利点がある。したがって、本症例で",
    "tags": []
  },
  {
    "id": "r110-341",
    "year": 110,
    "question_number": 341,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "27歳女性。身長159cm、体重50kg。この患者の母親が、処方箋を持って薬局を訪れた。この患者は、2年前から、双極性障害と診断され、処方1の薬剤による治療を継続中である。お薬手帳及び薬剤服用歴を確認したところ、今回から処方2の薬剤が追加されている。患者の母親と面談したところ、「最近、娘は夜眠らずに活動する日もあり、早口で話すことも多くなった。」とのことであった。\n薬剤師がこの患者の母親へ指導した内容についてSOAP形式で薬剤服用歴管理記録簿に記載した。（S）、（O）、（A）、（P）の項目と対応する記載内容として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "S：過量投与による中毒を予防するために、継続して血中リチウム濃度の数値や変化を確認すること。"
      },
      {
        "key": 2,
        "text": "O：「最近、娘は夜眠らずに活動する日もあり、早口で話すことも多くなった。」との患者の母親から聞きとった情報。"
      },
      {
        "key": 3,
        "text": "O：次回来局時に、血糖値上昇や体重増加などの副作用発現の有無を確認すること。"
      },
      {
        "key": 4,
        "text": "A：臨床所見及び検査値の結果を確認し、処方2の薬剤の服用開始が可能であると判断したこと。"
      },
      {
        "key": 5,
        "text": "P：処方2の薬剤により体重増加のおそれがあるため、娘に食事等に注意し適度な運動を心掛けるように伝えてもらうこと。"
      }
    ],
    "correct_answer": 4,
    "explanation": "本問は、SOAP形式に基づく薬剤服用歴管理指導記録の記載について問う問題である。\n\nSOAPとは、POS（Problem Oriented System：問題志向型システム）に基づき、薬剤師が得た情報を以下の4項目に分類して記録する方式である：\n\n　S（Subjective data：主観的情報）：患者や家族から得た訴えや生活情報など\n\nO（Objective data：客観的情報）：検査値、処方内容、薬剤師が観察・測定した情報\n\nA（Assessment：評価）：薬剤師としての評価や判断\n\nP（Plan：計画）：今後の指導方針や対応計画\n\n１　誤\n\n「継続して血中リチウム濃度の数値や変化を確認すること」は、今後の対応方針であり、P（計画）に該当する。\n\n２　誤\n\n「最近、娘は夜眠らずに活動する日もあり～」は患者家族からの聞き取り情報であり、主観的情報であり、S（主観的情報）に該当する。\n\n３　誤\n\n「副作用発現の有無を確認すること」は、今後の対応方針であり、P（計画）に該当する。\n\n４　正\n\n「オランザピンにより高血糖や肥満が起こる可能性がある」という薬剤師の評価・判断を述べているた",
    "tags": []
  },
  {
    "id": "r110-342",
    "year": 110,
    "question_number": 342,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "75歳男性。50歳の娘と二人暮らし。娘は、父親の服薬管理の相談のため、薬局を訪れた。父親は、当該薬局で一包化調剤を受け、1日3回、朝食後、夕食後、就寝前に処方薬を服用している。父親は、自分でお薬カレンダーに服用時点ごとに一包化した薬剤をセットしているが、加齢黄斑変性による視力の低下が原因で、最近、セットミスが多くなってきた。父親は身の回りのことを自分でしたいとの願望が強く、娘は、このまま父親に薬剤管理をさせてあげたいと思っている。娘が持参した一包化された薬剤は以下のとおりである。なお、父親に特に物忘れはなく、日常生活にも問題はない。\n薬剤師が、薬剤のセットミスを軽減できる可能性が高い工夫はどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "氏名の印字を「ひらがな」に変更する。"
      },
      {
        "key": 2,
        "text": "用法のフォントサイズを大きくする。"
      },
      {
        "key": 3,
        "text": "効能・効果の印字を追加する。"
      },
      {
        "key": 4,
        "text": "服用時点ごとに色分けしたラインを分包紙に引く。"
      },
      {
        "key": 5,
        "text": "合剤への処方変更を医師に提案し、服用剤数を減らす。"
      }
    ],
    "correct_answer": 2,
    "explanation": "本問は、加齢に伴う視力低下によって薬剤のセットミスが多発している患者に対し、一包化薬の表示内容の工夫によって服薬支援を強化する方法を問うものである。本患者は加齢黄斑変性により視認性が低下し、特に同じ用法（朝食後など）の薬が重複してセットされる誤りが生じている。服用時点の識別を容易にするためには、表示の視認性を高めることが重要である。\n\n１　誤\n\n氏名を「ひらがな」に変更しても、服用タイミングの識別には直結しない。\n\n２　正\n\n視力低下がある場合、フォントサイズを大きくすることで視認性が向上し、用法（朝食後・夕食後・就寝前など）の見間違い防止につながる。\n\n３　誤\n\n効能・効果の記載は、服用タイミングの識別には直結しない。\n\n４　正\n\n服用時点ごとに色分けすることは、視覚的に服用時点を直感的に判別できるため、視力が低下していてもミスを防ぐ有効な対策となる。\n\n５　誤\n\n合剤に変更すれば薬の錠数は減らせるが、服用のタイミングは変わらない。そのため、薬カレンダーにセットする袋の数は同じであり、セットミスの減少にはつながりにくい。",
    "tags": []
  },
  {
    "id": "r110-343",
    "year": 110,
    "question_number": 343,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "以下の薬局製造販売医薬品の製造及び販売に関して正しいのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "12歳未満にも対応できるようにジヒドロコデインを半量とした医薬品を製造する。"
      },
      {
        "key": 2,
        "text": "原料の製造番号や秤量値などを記載した製造記録を作成する。"
      },
      {
        "key": 3,
        "text": "販売前に他の痛み止めを服用していないことを確認する。"
      },
      {
        "key": 4,
        "text": "薬剤師不在時に登録販売者が販売する。"
      },
      {
        "key": 5,
        "text": "当該薬局で製造したものを系列の他店舗において販売する。"
      }
    ],
    "correct_answer": 2,
    "explanation": "本問は「薬局製造販売医薬品」に関する法規制・安全管理の知識を問う問題である。薬局製造販売医薬品は、薬剤師が薬局内で製造し、その薬局内でのみ販売・授与できる医薬品であり、製造から販売に至るまで厳密な規定が存在する。\n\n１　誤\n\n薬局製造販売医薬品は、薬局製剤指針に従って製造することが必要であり、成分量を任意に変更することは認められていない。また、ジヒドロコデインリン酸塩は、12歳未満に禁忌（呼吸抑制のリスクがある）である。\n\n２　正\n\n薬局製剤を製造するにあたっては、原料の製造番号や秤量値などを記載した製造記録を作成することが義務付けられている。\n\n３　正\n\n本製剤にはアセトアミノフェンやエテンザミドといった鎮痛成分が重複して含まれており、他の鎮痛薬との併用により過量投与のリスクがあるため、販売時に服薬状況を確認する必要がある。\n\n４　誤\n\n薬局製造販売医薬品の販売は薬剤師に限られており、登録販売者では販売できない。\n\n５　誤\n\n「製造したその薬局」において、その薬局の管理下でのみ患者に対して販売または授与が可能である。他店舗やチェーン店で販売することはできない。",
    "tags": []
  },
  {
    "id": "r110-344",
    "year": 110,
    "question_number": 344,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "32歳女性。半年前に家族性高コレステロール血症と診断され、生活習慣の改善及び以下の処方の薬剤による治療を行っている。冠動脈疾患の既往歴はない。LDL-Cは管理目標値まで下げることができたが、本日の診察の際に患者から「妊娠の可能性がある」との報告があり、薬剤の変更が検討された。\nこの患者に提案できる治療薬はどれか。1つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "ロスバスタチン"
      },
      {
        "key": 2,
        "text": "プロブコール"
      },
      {
        "key": 3,
        "text": "コレスチミド"
      },
      {
        "key": 4,
        "text": "ペマフィブラート"
      },
      {
        "key": 5,
        "text": "ロミタピド"
      }
    ],
    "correct_answer": 3,
    "explanation": "１　誤\n\nロスバスタチンはHMG-CoA還元酵素阻害薬であり、LDL-C低下作用に優れるが、胎児の発育に悪影響を与えるおそれがあるため、妊婦または妊娠している可能性のある女性には禁忌である。\n\n２　誤\n\nプロブコールは、LDL-C低下作用を有するが、妊婦には投与不可である。\n\n３　正\n\nコレスチミドは、陰イオン交換樹脂であり、腸管内で胆汁酸と結合して作用する。消化管内で作用し、ほとんど吸収されないことから、全身性の影響が少なく、妊婦や妊娠の可能性のある女性にも使用可能とされている。\n\n４　誤\n\nペマフィブラートは、フィブラート系薬剤であり、中性脂肪（TG）高値に対して用いられるが、妊婦には使用できない。また、本症例はTG高値ではなくLDL-Cの管理が主目的であるため不適である。\n\n５　誤\n\nロミタピドは、ミクロソームトリグリセリド転送タンパク質（MTP）阻害薬であり、重度の家族性高コレステロール血症に使用されるが、妊婦・妊娠可能女性には禁忌である。",
    "tags": []
  },
  {
    "id": "r110-345",
    "year": 110,
    "question_number": 345,
    "section": "実践",
    "subject": "実務",
    "category": "",
    "question_text": "62歳女性。卵巣がんにて、パクリタキセル、カルボプラチン、ベバシズマブを用いた外来化学療法を施行している。ベバシズマブの重大な副作用である血栓塞栓症の早期発見のために、患者に伝えておくべき自覚症状として適切なのはどれか。2つ選べ。",
    "choices": [
      {
        "key": 1,
        "text": "口渇"
      },
      {
        "key": 2,
        "text": "息苦しさ"
      },
      {
        "key": 3,
        "text": "黒色便"
      },
      {
        "key": 4,
        "text": "胸の痛み"
      },
      {
        "key": 5,
        "text": "味覚障害"
      }
    ],
    "correct_answer": 2,
    "explanation": "ベバシズマブは、血管内皮増殖因子（VEGF）に対するヒト化モノクローナル抗体であり、腫瘍への血流供給を抑制することで抗腫瘍効果を示す。一方で、血管新生の抑制に起因する重大な副作用がいくつか報告されている。\n\n【主な重大な副作用】\n\n・高血圧性脳症、高血圧クリーゼ\n\n・血栓塞栓症（動脈・静脈）\n\n・出血（鼻出血、消化管出血など）\n\n・消化管穿孔\n\n・創傷治癒遅延\n\n【血栓塞栓症に関連する自覚症状】\n\n血栓塞栓症（例：肺塞栓症、心筋梗塞、脳梗塞）では、以下のような警戒すべき初期症状が現れる\n\n・呼吸困難（息苦しさ）\n\n・胸部の痛み\n\n・手足のしびれ・麻痺\n\n・構音障害（言葉が出にくい）\n\n・四肢の腫脹や疼痛\n\nこれらは、血栓塞栓症の早期徴候として非常に重要であり、早期の医療機関受診につなげるために、患者にあらかじめ説明しておく必要がある。したがって、選択肢2「息苦しさ」、および選択肢4「胸の痛み」は、血栓塞栓症の早期症状として最も適切である。",
    "tags": []
  }
]
