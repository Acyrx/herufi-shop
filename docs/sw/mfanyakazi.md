# Mwongozo wa Mfanyakazi

Kama **Mfanyakazi wa Herufi**, unafanya kazi katika duka ambalo mmiliki amekuteua. Ufikiaji wako unaathiriwa na **idhini** ambazo mmiliki wako amesanidi kwa jukumu lako.

---

## Orodha ya Maudhui

1. [Kupata Akaunti](#1-kupata-akaunti)
2. [Kuteuliwa kwa Duka](#2-kuteuliwa-kwa-duka)
3. [Kuingia](#3-kuingia)
4. [Kuchagua Mazingira ya Kazi](#4-kuchagua-mazingira-ya-kazi)
5. [Dashibodi Yako](#5-dashibodi-yako)
6. [Kutumia POS](#6-kutumia-pos)
7. [Kusimamia Bidhaa](#7-kusimamia-bidhaa)
8. [Kusimamia Maagizo](#8-kusimamia-maagizo)
9. [Kutazama Wateja](#9-kutazama-wateja)
10. [Kubadilisha Mazingira ya Kazi](#10-kubadilisha-mazingira-ya-kazi)
11. [Maelezo ya Idhini](#11-maelezo-ya-idhini)

---

## 1. Kupata Akaunti

Kama bado huna akaunti ya Herufi:

1. Fungua programu ya Herufi na bonyeza **Fungua akaunti**.
2. Weka **Jina Kamili**, **Barua pepe**, **Simu** (si lazima), na **Nywila**.
3. Kwa **Jukumu**, chagua **Mmiliki wa Duka** au **Mteja** — jukumu la mfanyakazi hutolewa na mwajiri wako, sio kuchaguliwa wakati wa usajili.
4. Bonyeza **Fungua Akaunti**.

> **Mwambie mwajiri wako barua pepe au nambari ya simu yako** ili aweze kukutafuta na kukuteua kwa duka lake.

---

## 2. Kuteuliwa kwa Duka

Hujiteui mwenyewe. Mwajiri wako (mmiliki wa duka) atakapofanya hivyo:

1. Kutafuta akaunti yako kwa kutumia jina lako, barua pepe, au simu.
2. Kuchagua jukumu kwako (Msaidizi wa Malipo, Meneja, Msimamizi wa Hifadhi, Meneja wa Usafirishaji, au Wakala wa Mauzo).
3. Kuweka idhini maalum (mfano: "anaweza kushughulikia maagizo", "anaweza kutazama bidhaa").
4. Kubonyeza **Teua Mfanyakazi**.

Utapata ufikiaji mara moja kwenye kuingia kwako kwa ijayo.

---

## 3. Kuingia

1. Nenda kwenye ukurasa wa kuingia wa Herufi.
2. Weka **barua pepe** na **nywila** yako.
3. Bonyeza **Ingia**.

> **Usalama:** Baada ya majaribio 5 ya kushindwa kuingia, akaunti yako inafungwa kwa dakika 15.

---

## 4. Kuchagua Mazingira ya Kazi

Kama umepewa nafasi ya kufanya kazi kama mfanyakazi, utaona skrini ya **Kichaguzi cha Mazingira ya Kazi** baada ya kuingia. Inaonyesha sehemu mbili:

### Fanya Kazi kama Mfanyakazi

Kila duka unalohusika nalo linaonekana kama kadi inayoonyesha:
- Jina la duka na mahali
- Jukumu lako (mfano: Msaidizi wa Malipo, Meneja)
- Idadi ya idhini zilizotolewa

Gonga kadi ya duka ili uingie kwenye dashibodi ya duka hilo na idhini zako za mfanyakazi.

### Biashara Yangu Mwenyewe

Kama pia una biashara yako mwenyewe, gonga hapa kubadilisha hadi hali ya mmiliki na kusimamia maduka yako.

> Unaweza kubadilisha mazingira ya kazi wakati wowote — angalia [Kubadilisha Mazingira ya Kazi](#10-kubadilisha-mazingira-ya-kazi).

---

## 5. Dashibodi Yako

Baada ya kuchagua duka, unafika kwenye **Dashibodi**. Inaonyesha:
- Mapato ya leo na hesabu ya maagizo kwa duka lako
- Tahadhari za hifadhi ndogo na kuisha
- Maagizo ya hivi karibuni
- Maarifa ya biashara ya AI

**Upande wa kushoto** unaonyesha tu sehemu unazoruhusiwa kufikia. Maeneo ya mmiliki tu (Maduka Yangu, Wafanyakazi, Mipangilio) yamefichwa.

---

## 6. Kutumia POS

> Inahitaji: idhini ya `process_orders`

POS ni zana kuu kwa wasaidizi wa malipo na wakala wa mauzo.

### Kushughulikia Uuzaji

1. Nenda kwa **POS** kwenye upande wa kushoto.
2. Tafuta bidhaa kwa jina au SKU.
3. Gonga bidhaa kuiongeza kwenye kikapu. Badilisha idadi ikiwa inahitajika.
4. Tumia **punguzo** kama una idhini ya `manage_discounts`.
5. Chagua **njia ya malipo** (Pesa taslimu, Pesa ya Simu, n.k.).
6. Gonga **Lipa** kukamilisha muamala.
7. Risiti inatengenezwa kiotomati.

### Nini Kufanya Bidhaa Haikupatikana?

Bidhaa huenda bado haijawekwa kwenye hifadhi. Wasiliana na meneja wako au mmiliki wa duka kuiongeza.

---

## 7. Kusimamia Bidhaa

> Inahitaji: `view_inventory` (kutazama) na `edit_inventory` (kuongeza/kuhariri)

### Kutazama Bidhaa

Nenda kwa **Bidhaa** kuona bidhaa zote. Unaweza kuchuja kwa kategoria au kutafuta kwa jina/SKU.

### Kuhariri Hifadhi (kama unaruhusiwa)

1. Bonyeza bidhaa kuifungua.
2. Sasisha idadi, bei, au tarehe ya kuisha.
3. Bonyeza **Hifadhi**.

### Kuongeza Bidhaa (kama unaruhusiwa)

Bonyeza **Ongeza Bidhaa** na jaza maelezo ya bidhaa.

> Huwezi kufuta bidhaa — ni wamiliki tu wanaweza kuzizima.

---

## 8. Kusimamia Maagizo

> Inahitaji: `view_orders` (kutazama) na `process_orders` (kusasisha hali)

### Kutazama Maagizo

Nenda kwa **Maagizo** kuona maagizo yote ya duka lako. Tumia upau wa utafutaji na vichujio vya hali kupata maagizo maalum.

### Kusasisha Hali ya Agizo

1. Bonyeza ikoni ya jicho kwenye agizo.
2. Tumia vitufe vya vitendo kupigilia mbele agizo:
   - **Thibitisha** → Inashughulikiwa → Imesafirishwa → Imewasilishwa
   - **Futa** (kama bado inasubiri)

---

## 9. Kutazama Wateja

> Inahitaji: idhini ya `view_customers`

Nenda kwa **Wateja** kutazama orodha ya wateja wa duka lako. Unaweza kuona:
- Jina la mteja na mawasiliano
- Historia ya manunuzi
- Salio la pointi za uaminifu
- Mkopo unaoendelea

> Kuhariri rekodi za wateja kunahitaji idhini ya `edit_customers`.

---

## 10. Kubadilisha Mazingira ya Kazi

Unaweza kubadilisha kati ya maduka yako ya mfanyakazi au biashara yako mwenyewe bila kutoka nje.

**Kutoka kwenye upande wa kushoto:**
1. Tazama jina la duka juu ya upande wa kushoto.
2. Chini yake, bonyeza **Badili mazingira ya kazi**.
3. Kichaguzi cha Mazingira ya Kazi kinafunguka — chagua duka tofauti au ubadilishe hadi biashara yako mwenyewe.

---

## 11. Maelezo ya Idhini

Mmiliki wako anasanidi sehemu gani unazoweza kufikia. Ukijaribu kutembelea ukurasa ambao huna ruhusa, utapelekwa kiotomati kwenye dashibodi.

| Idhini | Inafungua |
|---|---|
| `view_inventory` | Tazama ukurasa wa Bidhaa |
| `edit_inventory` | Ongeza, hariri bidhaa |
| `view_orders` | Tazama ukurasa wa Maagizo |
| `process_orders` | Tumia POS, sasisha hali ya agizo |
| `view_customers` | Tazama ukurasa wa Wateja |
| `edit_customers` | Hariri wasifu wa wateja |
| `view_reports` | Pata Uchambuzi, Ripoti, Mauzo |
| `view_financial` | Tazama ukurasa wa Fedha |
| `process_refunds` | Toa marejesho kwenye maagizo |
| `manage_discounts` | Tumia punguzo kwenye POS |

Kama unahitaji ufikiaji wa ziada, omba mmiliki wa duka wako kusasisha idhini zako kwenye sehemu ya **Wafanyakazi**.

---

*Imesasishwa: Mei 2026*
