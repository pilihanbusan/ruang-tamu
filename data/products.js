/* ==========================================================
   DATA PRODUK SHOWROOM — edit file ini untuk mengganti isi panel
   - id      : jangan diubah (terhubung ke objek 3D di ruangan)
   - photo   : taruh foto di folder photos/ dengan nama yang sama
   - den/did : deskripsi bahasa Inggris / Indonesia
   ========================================================== */
window.CATS={
  furniture:{en:'Furniture',id:'Furnitur',c:'#a46a3f'},
  textile:{en:'Textile & Craft',id:'Tekstil & Kriya',c:'#9c3d2e'},
  homeware:{en:'Homeware',id:'Peralatan Rumah',c:'#4f7a62'},
  food:{en:'Food & Beverage',id:'Makanan & Minuman',c:'#b7801f'}
};
window.PRODUCTS=[
 {id:'ikat',photo:'photos/ikat.jpg',cat:'textile',emoji:'🧶',name:'Ikat Woven Throw',origin:'Sumba, East Nusa Tenggara',
  material:'Hand-spun cotton, natural dyes',size:'130 × 180 cm',moq:'30 pcs',lead:'60–90 days',hs:'6301.30',cert:'Handmade, natural dyes',
  den:'Yarns are tied and dyed before weaving on traditional back-strap looms, so every motif is planned thread by thread. Works as a throw, bed runner or wall textile.',
  did:'Benang diikat dan dicelup sebelum ditenun dengan alat tenun gedogan, sehingga setiap motif dirancang helai demi helai. Bisa jadi selimut, bed runner, atau hiasan dinding.'},
 {id:'rattan',photo:'photos/rattan.jpg',cat:'furniture',emoji:'🪑',name:'Handwoven Rattan Lounge Chair',origin:'Cirebon, West Java',
  material:'Natural rattan, solid teak legs',size:'W 72 × D 80 × H 85 cm',moq:'40 pcs',lead:'30–45 days',hs:'9401.59',cert:'SVLK-verified timber',
  den:'Woven by hand in Cirebon, Indonesia\'s rattan furniture hub. Lightweight yet durable — suited to living rooms, resorts and hospitality projects.',
  did:'Dianyam tangan di Cirebon, sentra mebel rotan Indonesia. Ringan namun kuat — cocok untuk ruang tamu, resort, dan proyek perhotelan.'},
 {id:'teak',photo:'photos/teak.jpg',cat:'furniture',emoji:'🪵',name:'Solid Teak Coffee Table',origin:'Jepara, Central Java',
  material:'Plantation teak, natural oil finish',size:'L 120 × W 70 × H 42 cm',moq:'20 pcs',lead:'45–60 days',hs:'9403.60',cert:'SVLK-verified timber',
  den:'Made by Jepara woodworkers, known for generations of teak joinery. Clean lines, a lower shelf, and a knock-down option for efficient container loading.',
  did:'Dibuat perajin Jepara yang turun-temurun ahli olah kayu jati. Desain bersih, rak bawah, dan opsi knock-down agar efisien dimuat ke kontainer.'},
 {id:'ceramics',photo:'photos/ceramics.jpg',cat:'homeware',emoji:'🏺',name:'Stoneware Tea Set',origin:'Kasongan, Yogyakarta',
  material:'Glazed stoneware, lead-free glaze',size:'Teapot 0.8 L, 2 cups, bud vase',moq:'100 sets',lead:'30–45 days',hs:'6912.00',cert:'Food-contact safe',
  den:'Thrown and glazed in Kasongan, a pottery village with centuries of clay tradition. Soft sage glaze, food-safe and dishwasher friendly.',
  did:'Dibentuk dan diglasir di Kasongan, desa gerabah dengan tradisi tanah liat berabad-abad. Glasir hijau sage, aman untuk makanan.'},
 {id:'batik',photo:'photos/batik.jpg',cat:'textile',emoji:'🖼️',name:'Hand-drawn Batik Wall Art',origin:'Pekalongan, Central Java',
  material:'Cotton primissima, natural dyes, teak frame',size:'170 × 105 cm',moq:'10 pcs',lead:'21–30 days',hs:'5208.52',cert:'Batikmark certified',
  den:'Batik tulis drawn by hand with a canting and hot wax — a craft inscribed by UNESCO as Intangible Cultural Heritage in 2009. Every piece is one of a kind.',
  did:'Batik tulis yang digambar tangan dengan canting dan malam — warisan budaya takbenda UNESCO sejak 2009. Setiap karya hanya ada satu.'},
 {id:'basket',photo:'photos/basket.jpg',cat:'homeware',emoji:'🧺',name:'Seagrass Planter Basket',origin:'Tasikmalaya, West Java',
  material:'Natural seagrass, removable liner',size:'Ø 40 × H 38 cm',moq:'200 pcs',lead:'30 days',hs:'4602.19',cert:'Natural fibre',
  den:'Hand-woven seagrass from Tasikmalaya\'s weaving communities. Nests in sets for compact shipping; available in natural and two-tone finishes.',
  did:'Anyaman lamun dari komunitas perajin Tasikmalaya. Bisa ditumpuk (nesting) agar hemat ruang pengiriman; tersedia warna natural dan dua tone.'},
 {id:'coffee',photo:'photos/coffee.jpg',cat:'food',emoji:'☕',name:'Gayo Arabica Coffee',origin:'Gayo Highlands, Aceh',
  material:'Specialty grade, washed process',size:'250 g / 1 kg roasted · 60 kg green',moq:'500 packs roasted · 1 FCL green',lead:'14–30 days',hs:'0901.21',cert:'Geographical Indication (GI)',
  den:'Grown at 1,200–1,600 m in Aceh\'s Gayo Highlands. Full body, low acidity, with notes of spice and dark chocolate.',
  did:'Ditanam di ketinggian 1.200–1.600 m Dataran Tinggi Gayo, Aceh. Body tebal, keasaman rendah, dengan aroma rempah dan cokelat.'},
 {id:'chocolate',photo:'photos/chocolate.jpg',cat:'food',emoji:'🍫',name:'Single-Origin Dark Chocolate 70%',origin:'Sulawesi cocoa, made in Bali',
  material:'Fermented cocoa, cane sugar',size:'80 g bar · 12 bars per box',moq:'1,000 bars',lead:'21 days',hs:'1806.32',cert:'Halal certified',
  den:'Bean-to-bar chocolate from fermented Sulawesi cocoa — Indonesia is one of the world\'s largest cocoa producers. Fruity, bright and clean.',
  did:'Cokelat bean-to-bar dari kakao Sulawesi yang difermentasi — Indonesia termasuk produsen kakao terbesar dunia. Rasa buah yang segar dan bersih.'},
 {id:'spice',photo:'photos/spice.jpg',cat:'food',emoji:'🌰',name:'Maluku Spice Collection',origin:'Banda Islands, Maluku',
  material:'Nutmeg, mace, clove, cinnamon',size:'Gift box 4 × 50 g',moq:'500 boxes',lead:'21–30 days',hs:'0908 / 0907',cert:'Halal certified',
  den:'From the Banda Islands, the original home of nutmeg and the heart of the historic spice route. A ready-to-retail gift set.',
  did:'Dari Kepulauan Banda, asal mula pala dan jantung jalur rempah dunia. Gift set siap jual di ritel.'}
];
