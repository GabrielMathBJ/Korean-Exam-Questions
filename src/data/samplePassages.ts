import { SamplePassage } from '../types';

export const SAMPLE_PASSAGES: SamplePassage[] = [
  {
    id: 'sample-hegel',
    title: '헤겔의 미학과 절대정신',
    category: '독서',
    subcategory: '인문·예술',
    source: '2022학년도 대학수학능력시험 국어영역 기출 변형',
    text: `(가) 정립-반정립-종합. 변증법의 논리적 구조를 일컫는 말이다. 변증법에 따라 직관, 표상, 사유는 절대정신이 스스로를 자각해 가는 세 가지 형식이다. 예술은 직관을 통해 물질적 대상을 감각적으로 지각하며, 종교는 표상을 통해 감각적 요소를 마음속에 심상으로 간직하고, 철학은 사유를 통해 순수한 논리적 개념으로 대상을 파악한다. 절대정신은 이 세 형식을 거치며 마침내 자신을 완전하게 실현한다. 헤겔에 따르면 예술은 감각적 매체에 얽매여 있기에 절대정신을 완벽하게 구현할 수 없으며, 종교를 거쳐 궁극적으로 철학에 이르러서야 절대정신은 감각적 한계를 벗어나 자유로운 사유의 형태로 완성된다.

(나) 그러나 헤겔의 체계는 예술의 독자적 가치를 지나치게 하위 단계로 격하시켰다는 비판을 받는다. 헤겔은 감각적 직관을 개념적 사유보다 열등한 단계로 규정하고, 예술이 철학에 흡수되어 해소된다는 '예술 종말론'을 주장했다. 그러나 예술이 제공하는 미적 체험은 단순히 개념적 인식으로 치환될 수 없는 고유한 생명력을 지닌다. 특히 근현대 예술은 논리적 사유가 포착하지 못하는 비합리적 충동과 감각의 자율성을 드러냄으로써, 이성 중심주의의 한계를 극복하는 유력한 계기로 작용한다. 따라서 예술을 절대정신의 초기 단계로만 국한하는 헤겔의 관점은 예술의 본질적 역동성을 충분히 설명하지 못한다.`,
    recommendedQuestionConfigs: [
      {
        id: 'cfg-1',
        questionNumber: 1,
        style: 'multiple_choice',
        behavioralDomain: 'factual',
        difficulty: 'medium',
        points: 2,
        requireBogi: false,
        targetSection: '전체 지문'
      },
      {
        id: 'cfg-2',
        questionNumber: 2,
        style: 'multiple_choice',
        behavioralDomain: 'inferential',
        difficulty: 'medium',
        points: 2,
        requireBogi: false,
        targetSection: '(가), (나) 비교'
      },
      {
        id: 'cfg-3',
        questionNumber: 3,
        style: 'multiple_choice',
        behavioralDomain: 'application',
        difficulty: 'high',
        points: 3,
        requireBogi: true,
        targetSection: '(나)의 비판적 관점'
      }
    ]
  },
  {
    id: 'sample-bretton-woods',
    title: '브레턴우즈 체제와 트리핀 딜레마',
    category: '독서',
    subcategory: '사회·경제',
    source: '2022학년도 대학수학능력시험 국어영역 기출 변형',
    text: `기축 통화는 국제 거래의 결제 수단으로 통용되고 환율의 기준이 되는 통화이다. 1944년에 성립된 브레턴우즈 체제에서 미국 달러화는 금 1온스당 35달러로 고정되고, 다른 국가들의 통화는 달러화에 대해 고정 환율을 유지하는 '금 본위 체제'를 구축했다.

그러나 기축 통화국인 미국은 전 세계에 유동성을 충분히 공급하기 위해 지속적인 경상 수지 적자를 감수해야 했다. 만약 미국이 경상 수지 적자를 유지하여 달러화를 계속 공급하면 달러화의 가치가 하락하여 신뢰도가 떨어지게 된다. 반대로 미국이 달러화의 신뢰도를 유지하기 위해 경상 수지 흑자를 추구하면 전 세계에 공급되는 달러화의 유동성이 부족해져 세계 무역과 경제가 위축되는 모순에 직면한다. 이를 경제학자 트리핀의 이름을 따서 '트리핀 딜레마'라고 부른다.

결국 미국의 금 보유량이 급감하고 달러화에 대한 신뢰가 무너지면서, 1971년 닉슨 대통령이 달러화와 금의 태환 정지를 선언함에 따라 브레턴우즈 체제는 붕괴되었다. 이후 세계 통화 체제는 변동 환율 제도로 이행하게 되었다.`,
    recommendedQuestionConfigs: [
      {
        id: 'cfg-bw-1',
        questionNumber: 1,
        style: 'multiple_choice',
        behavioralDomain: 'factual',
        difficulty: 'medium',
        points: 2,
        requireBogi: false,
        targetSection: '전체 지문'
      },
      {
        id: 'cfg-bw-2',
        questionNumber: 2,
        style: 'multiple_choice',
        behavioralDomain: 'inferential',
        difficulty: 'high',
        points: 3,
        requireBogi: true,
        targetSection: '트리핀 딜레마의 메커니즘'
      },
      {
        id: 'cfg-bw-3',
        questionNumber: 3,
        style: 'descriptive',
        behavioralDomain: 'application',
        difficulty: 'medium',
        points: 3,
        requireBogi: false,
        targetSection: '브레턴우즈 체제 붕괴 원인'
      }
    ]
  },
  {
    id: 'sample-image-processing',
    title: '디지털 영상의 픽셀 보간법과 HDR 기술',
    category: '독서',
    subcategory: '과학·기술',
    source: '한국교육과정평가원 모의평가 과학기술 영역 변형',
    text: `디지털 카메라는 피사체의 빛 정보를 이미지 센서의 각 화소(Pixel)에 전기적 신호로 기록한다. 센서가 받아들일 수 있는 빛의 최소량과 최대량의 비율을 '동적 범위(Dynamic Range)'라고 부른다. 일반적인 센서는 인간의 눈보다 동적 범위가 좁아, 밝은 영역은 하얗게 날아가고(White Hole), 어두운 영역은 검게 뭉개지는(Black Hole) 현상이 발생한다.

이를 보완하기 위해 고안된 기술이 HDR(High Dynamic Range)이다. HDR은 동일한 구도의 피사체를 각기 다른 노출 시간으로 여러 장 연속 촬영한 후 이를 하나로 합성하는 알고리즘이다. 노출 시간을 짧게 한 영상에서는 밝은 영역의 세부 정보를 추출하고, 노출 시간을 길게 한 영상에서는 어두운 영역의 세부 정보를 추출한다. 

합성 과정에서는 각 픽셀 위치의 밝기 가중치를 계산하는 톤 매핑(Tone Mapping) 기법이 적용된다. 이때 인접한 픽셀 간의 밝기 차이가 급격히 변하는 경계면(Edge)을 보존하기 위해 공간 필터링을 수행하며, 이를 통해 인간의 시각 인지와 유사한 자연스러운 명암 계조를 가진 최종 이미지를 생성한다.`,
    recommendedQuestionConfigs: [
      {
        id: 'cfg-ip-1',
        questionNumber: 1,
        style: 'multiple_choice',
        behavioralDomain: 'factual',
        difficulty: 'medium',
        points: 2,
        requireBogi: false,
        targetSection: '전체 지문'
      },
      {
        id: 'cfg-ip-2',
        questionNumber: 2,
        style: 'multiple_choice',
        behavioralDomain: 'application',
        difficulty: 'high',
        points: 3,
        requireBogi: true,
        targetSection: 'HDR 촬영 및 합성 알고리즘'
      }
    ]
  },
  {
    id: 'sample-modern-poetry',
    title: '윤동주 <자화상> & 백석 <여승>',
    category: '문학',
    subcategory: '현대시',
    source: '한국교육과정평가원 수능 국어 문학 명작 선별',
    text: `(가) 윤동주, 「자화상(自畵像)」
산모퉁이를 돌아 논가 외딴 우물을 홀로 찾아가선 가만히 들여다봅니다.

우물 속에는 달이 밝고 구름이 흐르고 하늘이 펼치고 파아란 바람이 불고 가을이 있습니다.

그리고 한 사나이가 있습니다.
어쩐지 그 사나이가 미워져 돌아갑니다.

돌아가다 생각하니 그 사나이가 가엾어집니다.
도로 가 들여다보니 사나이는 그대로 있습니다.

다시 그 사나이가 미워져 돌아갑니다.
돌아가다 생각하니 그 사나이가 그리워집니다.

우물 속에는 달이 밝고 구름이 흐르고 하늘이 펼치고 파아란 바람이 불고 가을이 있고 추억(追憶)처럼 사나이가 있습니다.

(나) 백석, 「여승(女僧)」
여승은 합장하고 절을 했다
가지취의 내음새가 났다
쓸쓸한 낯이 옛날같이 늙었다
나는 불경(佛經)처럼 서러워졌다

평안도의 어느 산 깊은 금점판
나는 파리한 여인에게서 옥수수를 샀다
여인은 나 어린 딸아이를 따리며 가을밤같이 차게 울었다

섶벌같이 나아간 지아비 기다려 십 년이 갔다
지아비는 돌아오지 않고
어린 딸은 도라지꽃이 좋아 돌무덤으로 갔다

산꿩도 섦게 울은 슬픈 날이 있었다
산절의 마당귀에 여인의 머리오리가 눈물방울과 같이 떨어진 날이 있었다`,
    recommendedQuestionConfigs: [
      {
        id: 'cfg-mp-1',
        questionNumber: 1,
        style: 'multiple_choice',
        behavioralDomain: 'inferential',
        difficulty: 'medium',
        points: 2,
        requireBogi: false,
        targetSection: '(가)와 (나)의 공통점 및 표현상 특징'
      },
      {
        id: 'cfg-mp-2',
        questionNumber: 2,
        style: 'multiple_choice',
        behavioralDomain: 'critical',
        difficulty: 'high',
        points: 3,
        requireBogi: true,
        targetSection: '<보기>를 통한 내면 갈등과 역사적 비극성 해석'
      },
      {
        id: 'cfg-mp-3',
        questionNumber: 3,
        style: 'descriptive',
        behavioralDomain: 'inferential',
        difficulty: 'medium',
        points: 3,
        requireBogi: false,
        targetSection: '(가)에서 우물에 비친 사나이에 대한 화자의 태도 변화'
      }
    ]
  },
  {
    id: 'sample-classical-novel',
    title: '박지원 <허생전(許生傳)>',
    category: '문학',
    subcategory: '고전소설',
    source: '한국교육과정평가원 수능 국어 고전소설 기출 변형',
    text: `허생은 묵적골(墨積洞)에 살았다. 곧장 남산(南山) 밑에 닿으면, 우물 위에 오래된 은행나무가 서 있고, 사립문이 열렸는데 초가집이 비바람을 가리지 못했다. 그러나 허생은 글읽기만 좋아하고, 그의 아내가 남의 바느질을 품팔아서 겨우 입에 풀칠을 했다.

하루는 그 아내가 몹시 배가 고파서 울며 말했다.
"당신은 평생 과거(科擧)를 보지 않으니, 글을 읽어 무엇 합니까?"
허생이 웃으며 말했다.
"내가 아직 글을 다 익히지 못하였소."
"그럼 장인바치(工匠) 일이라도 못 하십니까?"
"장인 일은 본래 배우지 않았으니 어찌하겠소?"
"그럼 장사(商賈)라도 못 하십니까?"
"장사는 밑천이 없는 걸 어찌하겠소?"
아내는 왈칵 성을 내며 소리쳤다.
"밤낮으로 글을 읽더니 기껏 배운 것이 '어찌하겠소'란 말이오? 장인 일도 못 한다, 장사도 못 한다면, 도둑질이라도 못 하십니까?"

허생은 책을 덮고 일어나며,
"아깝다. 내가 당초 글읽기로 십 년을 채우려 했는데, 이제 칠 년 만에 그만두게 되었구나."
하고 문을 나서서 한양의 부자 변씨(卞氏)를 찾아갔다. 변씨에게 만 냥을 빌린 허생은 안성(安城)으로 내려가 과일류를 모두 사재기하여 독점적 이익을 취하였다.`,
    recommendedQuestionConfigs: [
      {
        id: 'cfg-cn-1',
        questionNumber: 1,
        style: 'multiple_choice',
        behavioralDomain: 'factual',
        difficulty: 'medium',
        points: 2,
        requireBogi: false,
        targetSection: '사건 전개 및 인물의 처지'
      },
      {
        id: 'cfg-cn-2',
        questionNumber: 2,
        style: 'multiple_choice',
        behavioralDomain: 'critical',
        difficulty: 'high',
        points: 3,
        requireBogi: true,
        targetSection: '실학적 관점에서 본 조선 경제 구조 비판'
      }
    ]
  }
];
