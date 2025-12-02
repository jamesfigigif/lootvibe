
const rawData = `1% iPhone
box
$
20.29
$
2.79
Haloween
1% PC
box
$
4.13
$
2.89
Haloween
Acer
box
$
8.79
$
6.99
Haloween
Adidas x BAPE
box
$
20.49
$
15.99
Haloween
Adidas x Gucci
box
$
84.49
$
69.99
Haloween
Adin Ross
box
$
14.49
$
12.79
Haloween
Alexander McQueen
box
$
72.48
$
63.99
Haloween
Alfa Romeo
box
$
564.99
$
469.99
Haloween
Alienware
box
$
16.89
$
14.49
Haloween
Amazon
box
$
8.49
$
6.79
Haloween
AMG Vs BMW
box
$
954.49
$
829.99
Haloween
AntiSocialSocialClub
box
$
9.59
$
7.99
Haloween
AP Vs Rolex
box
$
2549.98
$
2189.98
SaleHaloween
Apple Budget
box
$
48.09
$
5.99
Haloween
Apple Deluxe
box
$
118.89
$
109.99
Haloween
Apple Premium
box
$
41.49
$
32.99
SaleHaloween
Apple Vs Android
box
$
97.99
$
44.99
Haloween
Apple Vs Samsung
box
$
38.49
$
34.99
Haloween
Aston Martin
box
$
2929.99
$
2599.99
Haloween
Audemars Piguet
box
$
2179.99
$
1999.99
Haloween
Audi
box
$
909.49
$
719.99
Haloween
Audio Vault
box
$
11.29
$
9.39
Haloween
Bad Boy Bikes
box
$
254.99
$
239.99
Haloween
Balance Booster
box
$
4.29
$
2.39
Haloween
Balenciaga Budget
box
$
9.49
$
6.49
Haloween
Balenciaga Deluxe
box
$
239.99
$
219.99
Haloween
Balmain
box
$
59.99
$
52.49
Haloween
BAPE Budget
box
$
9.49
$
6.89
Haloween
BAPE Deluxe
box
$
137.99
$
104.99
Haloween
Barbie
box
$
8.99
$
7.49
Haloween
Batman
box
$
459.49
$
389.99
Haloween
Bearbrick
box
$
62.99
$
54.49
Haloween
Bentley
box
$
1999.99
$
1889.99
Haloween
Billionaire Boys Club
box
$
14.49
$
12.09
Haloween
Birkin
box
$
2414.99
$
2099.99
Haloween
Black Deals
box
$
3.49
$
2.69
Haloween
BMW
box
$
949.99
$
749.99
Haloween
Bose
box
$
9.19
$
7.99
Haloween
BRABUS
box
$
6249.99
$
5499.99
Haloween
BROKIE
box
$
2.14
$
1.59
Haloween
Budget Beast
box
$
1.34
$
0.89
Haloween
Budget Bentley
box
$
40.99
$
34.99
Haloween
Burberry Budget
box
$
8.99
$
5.89
Haloween
Burberry Deluxe
box
$
174.99
$
149.99
Haloween
Bvlgari
box
$
564.99
$
489.99
Haloween
BYD
box
$
529.99
$
459.99
Haloween
Cables
box
$
1.24
$
0.79
Haloween
Call Of Duty
box
$
7.87
$
5.79
Haloween
Cars Vs Watches
box
$
1849.99
$
1599.99
Haloween
Cartier
box
$
539.99
$
424.99
Haloween
Casablanca
box
$
68.48
$
60.99
Haloween
Casio
box
$
4.99
$
3.99
Haloween
Celine
box
$
172.49
$
149.99
Haloween
Chanel
box
$
26.39
$
21.99
Haloween
Cheap Finds
box
$
2.04
$
1.69
Haloween
China
box
$
2.84
$
2.24
Haloween
Chrome Hearts
box
$
169.99
$
144.99
Haloween
Chrono Collection
box
$
514.49
$
449.99
Haloween
Chrysler
box
$
509.99
$
444.99
Haloween
Coach
box
$
26.99
$
22.79
Haloween
Collectibles
box
$
112.29
$
99.99
Haloween
Come Up
box
$
12.99
$
9.69
Haloween
Comme des Garçons
box
$
18.99
$
14.79
Haloween
Console Vs PC
box
$
5.99
$
3.79
Haloween
Converse
box
$
14.99
$
12.19
Haloween
Corsair
box
$
21.99
$
18.89
Haloween
Corteiz
box
$
15.99
$
12.39
Haloween
Crocs
box
$
7.44
$
6.19
Haloween
Crypto King
box
$
11.99
$
9.79
Haloween
Dacia
box
$
444.99
$
409.99
Haloween
Dark Drip
box
$
6.89
$
5.49
Haloween
Datejust Vs Day-Date
box
$
1129.99
$
999.99
Haloween
Designers Dream
box
$
396.49
$
344.49
Haloween
Diamond Vault
box
$
1099.99
$
949.49
Haloween
Dior Budget
box
$
6.19
$
4.99
Haloween
Dior Deluxe
box
$
284.49
$
229.99
Haloween
Dirty Money
box
$
204.99
$
159.99
Haloween
Disney
box
$
5.89
$
4.59
Haloween
DJI
box
$
14.99
$
12.49
Haloween
Dodge
box
$
609.49
$
529.99
Haloween
Dragon Ball Z
box
$
16.98
$
13.89
Haloween
Drake OVO
box
$
34.49
$
27.99
Haloween
Drip Or Drown
box
$
1.89
$
1.49
Haloweenbox
Dubai Bling
box`;

const lines = rawData.split('\n').map(l => l.trim()).filter(l => l);
const boxes = [];

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Heuristic: Name is usually followed by "box"
    if (lines[i + 1] === 'box' || lines[i + 1] === 'Haloweenbox') { // Handle typo in raw data
        const name = line;
        let priceIndex = i + 2;
        if (lines[priceIndex] === '$') priceIndex++;
        const price = parseFloat(lines[priceIndex]);

        let salePriceIndex = priceIndex + 1;
        if (lines[salePriceIndex] === '$') salePriceIndex++;
        const salePrice = parseFloat(lines[salePriceIndex]);

        const tag = lines[salePriceIndex + 1] || 'NEW';

        if (!isNaN(price)) {
            boxes.push({
                id: name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
                name,
                price,
                salePrice: isNaN(salePrice) ? price : salePrice,
                tags: [tag === 'Haloween' || tag === 'Haloweenbox' ? 'HALLOWEEN' : tag.toUpperCase()],
                category: 'ALL', // Default
                description: "Win big with the " + name + ".",
                image: '', // To be generated
                color: 'from-slate-800 to-slate-900', // Default
                items: [] // Needs population
            });
        }

        i = salePriceIndex + 1;
    }
}

console.log(JSON.stringify(boxes, null, 2));
