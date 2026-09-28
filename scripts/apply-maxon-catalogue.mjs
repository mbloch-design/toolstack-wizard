import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const research=path.join(root,'research/maxon-2026-09-28');
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
const catalogue=await read(path.join(root,'src/data/tools_v4.json'));
const cores=await read(path.join(research,'core-copy.json'));
const sourceManifest=await read(path.join(research,'manifest.json'));
const docs=[];
for(const f of await fs.readdir(path.join(research,'manuals')))if(f!=='manifest.json')docs.push(await read(path.join(research,'manuals',f)));
const aliases={'exposure-blur-transition':'exposure-blur','warp':'warp-transition','stretch-transition-tool':'stretch','noir-moderne':'noir','grain16':'grain-16','chromatown-tool':'chromatown','sketchify-tool':'sketchify','symbol-mapper-tool':'symbol-mapper','holomatrix':'holomatrix-ii','shrinkray':'shrink-ray'};
const cleanImages=images=>[...new Set(images)].filter(u=>!/_1200x|_800x|_600x|Nemetschek|Maxon_Logo_PR|AppStore|maxon-logo|_icon|horizontal|vertical|Premiere_icon|AfterEffects_icon|Resolve_icon|Motion_icon|Vegas_icon|FinalCut_icon|Avid_icon|Dashboard|button|Banner_Dec/i.test(u));
const redGiant=await read(path.join(research,'red-giant.json'));
const universeLogo=redGiant.images.find(u=>/Universe.*(?:Mark|icon)/i.test(u));
const records=[];const changes=[];const blocked=[];
const date='2026-09-28';
const priceBase={verified_on:date,source_domain:'maxon.net',usage_sensitive:false,location_sensitive:true,compare_price_monthly_eur:null,official_source_url:'https://www.maxon.net/en/buy'};
function rating(scores,fr,en){
 const axes=['valeurAjoutee','simplicite','utilisation','puissance','reversibilite'];
 return {...Object.fromEntries(axes.map((k,i)=>[k,scores[i]])),notedOn:date,lastActivityVerifiedOn:null,evidence:Object.fromEntries(axes.map((k,i)=>[k,fr[i]+' Analyse documentaire des sources officielles, sans test pratique.'])),evidenceEn:Object.fromEntries(axes.map((k,i)=>[k,en[i]+' Documentary review of official sources; not a hands-on test.']))};
}
function base(slug,name,url){return {id:slug,slug,name,category:'creation',categoryId:'creation',bestFor:['designer'],tool_type:'plugin',substitutable:true,verticals:['motion-video','creative'],covers:['motion-design'],functional_needs:['motion-design'],articles:[],soloRelevance:'medium',teamRelevance:'high',websiteUrl:url,website:url,link:url,affiliateLink:'',defaultMonthlyPrice:null,timeGainedHoursPerMonth:null};}
function attach(item,source,images,logo){
 const candidates=cleanImages(images);if(candidates.length<2)throw Error('Insufficient distinct media for '+item.slug);
 item.logo=logo||'';item.ogImageUrl=candidates[0];item.galleryImages=candidates.slice(1,3);
 item.seo={metaDescription:`${item.name} : usages, licence, limites et avis ToolTrim. ${item.shortDescription}`.slice(0,160),metaDescriptionEn:`${item.name}: uses, licensing, limitations and ToolTrim review. ${item.shortDescriptionEn}`.slice(0,160),idealForFr:item.shortDescription,idealForEn:item.shortDescriptionEn};
 item.description=item.longDescription;
 records.push(item);changes.push({slug:item.slug,name:item.name,source,media:[item.ogImageUrl,...item.galleryImages],logo:item.logo,status:'implemented-awaiting-validation'});
}
for(const c of cores){
 const source=await read(path.join(research,c.source+'.json'));
 if(source.status!==200)throw Error('Invalid source '+c.source);
 const item={...base(c.slug,c.name,c.websiteUrl||source.sourceUrl),tool_type:c.type,bundle_parent:c.parent||null,shortDescription:c.fr,shortDescriptionEn:c.en,nameEn:c.nameEn||c.name,longDescription:`${c.name} : ${c.fr}\n\n${c.detailFr}\n\nAvant de choisir, vérifie les prérequis de ta machine, le format de livraison et les licences déjà incluses dans ta stack. Cette fiche repose sur la documentation officielle, pas sur un test pratique.`,longDescriptionEn:`${c.nameEn||c.name}: ${c.en}\n\n${c.detailEn}\n\nBefore choosing, check hardware requirements, delivery formats and licences already included in your stack. This listing is based on official documentation, not hands-on testing.`,pros:[c.fr],prosEn:[c.en],cons:['Compatibilité et licences à vérifier selon le poste et le workflow.','Prise en main et performances non mesurées par ToolTrim.'],consEn:['Check compatibility and licensing for your workstation and workflow.','ToolTrim has not measured usability or performance.'],useCases:[c.fr],useCasesEn:[c.en],verdict:{keepIf:[c.fr],avoidIf:['Ton outil actuel couvre déjà ce besoin sans étape supplémentaire.'],threshold:c.detailFr},verdictEn:{keepIf:[c.en],avoidIf:['Your existing tool already covers this need without another step.'],threshold:c.detailEn},alternatives:c.alternatives.filter(s=>catalogue.some(t=>t.slug===s))};
 if(c.annual){item.defaultMonthlyPrice=c.annual/12;item.pricing={free:'Essai proposé par Maxon.',paid:`${c.annual.toLocaleString('fr-FR')} EUR facturés par an pour ${c.name}. Prix régional et TVA définitifs au panier.`};item.pricingEn={free:'Trial offered by Maxon.',paid:`EUR ${c.annual.toLocaleString('en-GB')} billed annually for ${c.name}. Final regional pricing and VAT at checkout.`};item.pricing_v5={...priceBase,compare_price_monthly_eur:c.annual/12,compare_plan_kind:'subscription',compare_plan_name:c.name,price_reliability:'high',verification_status:'official_explicit',cautions:['Prix affiché sur la boutique Maxon en EUR. TVA maximale potentielle incluse dans l’affichage ; montant définitif au panier.','Paiement annuel, pas une licence perpétuelle.'],plans:[{planKey:'annual-eur',displayName:c.name,nativeAmount:c.annual,nativeCurrency:'EUR',summary:'Paiement annuel anticipé.',billingPeriod:'annual',billingCommitment:'annual_prepaid',pricingUnit:'par licence',isFree:false,isComparePlan:true,taxInclusion:'unknown',detailsSourceUrl:priceBase.official_source_url,observedOn:date,lastConfirmedOn:date}]};
 }else {const fr=c.free?'Gratuit.':c.freemium?'Version gratuite limitée.':'';const en=c.free?'Free.':c.freemium?'Limited free edition.':'';const access={zbrush:'ZBrush ou Maxon One','maxon-one':'Maxon One','ae-red-giant':'Red Giant ou Maxon One',cineware:'logiciels hôtes compatibles','adobe-after-effects':'After Effects',redshift:'bêta Redshift for Architects'};const paidFr=c.free?'':c.parent?`Accès lié à ${access[c.parent]||c.parent}. Vérifie les conditions de la formule.`:'Conditions à vérifier sur le site officiel et selon les logiciels hôtes.';item.pricing={free:fr,paid:paidFr};item.pricingEn={free:en,paid:c.free?'':c.parent?'Access depends on the relevant subscription or host application. Check plan conditions.':'Check official conditions and required host applications.'};item.pricing_v5={...priceBase,official_source_url:source.sourceUrl,compare_plan_kind:c.free?'free':c.slug==='redshift-for-architects'?'beta':c.parent?'included':'unknown',compare_plan_name:c.free?'Free':c.parent?(catalogue.find(t=>t.slug===c.parent)?.name||access[c.parent]||'Access conditions'):'Access conditions',price_reliability:c.free?'high':'medium',verification_status:'official_explicit',cautions:paidFr?[paidFr]:[],plans:c.free?[{planKey:'free',displayName:'Free',nativeAmount:0,nativeCurrency:'EUR',billingPeriod:null,billingCommitment:null,isFree:true,isComparePlan:true,detailsSourceUrl:source.sourceUrl,observedOn:date}]:[]};if(c.free)item.defaultMonthlyPrice=0;}
 item.pricing_v5En={...structuredClone(item.pricing_v5),cautions:[item.pricingEn.paid],plans:item.pricing_v5.plans.map(p=>({...p,summary:p.isFree?'Free download.':'Annual upfront payment.',pricingUnit:'per licence'}))};
 item.toolTrimRating=rating(c.scores,[c.fr,'Le workflow présenté demande de comprendre les fonctions du produit.','Pertinence liée à la récurrence de ce besoin dans une production.','Périmètre apprécié à partir des fonctions documentées, sans benchmark.','Vérifier la portabilité des projets et la disponibilité des licences avant archivage.'],[c.en,'The documented workflow requires understanding the product functions.','Usefulness depends on how often this need occurs in production.','Scope assessed from documented functions, without benchmarking.','Check project portability and licence availability before archiving.']);
 const logoSource=c.logoSource?await read(path.join(research,c.logoSource+'.json')):source;
 attach(item,source.sourceUrl,c.images.map(i=>source.images[i]),logoSource.images[c.logo]);
 if(c.annual){
  const frAmount=new Intl.NumberFormat('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(c.annual);
  const enAmount=new Intl.NumberFormat('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2}).format(c.annual);
  item.seo.presentationTitleFr=`${c.name} : ${frAmount} € par an, avis 2026 | ToolTrim`;
  item.seo.presentationTitleEn=`${c.name}: €${enAmount} per year, review 2026 | ToolTrim`;
  item.seo.prixTitleFr=`${c.name} prix 2026 : ${frAmount} € par an | ToolTrim`;
  item.seo.prixTitleEn=`${c.name} pricing 2026: €${enAmount} per year | ToolTrim`;
  item.seo.presentationMetaDescriptionFr=`${c.fr} Abonnement annuel : ${frAmount} € payés d'avance, selon les conditions affichées par Maxon.`.slice(0,160);
  item.seo.presentationMetaDescriptionEn=`${c.en} Annual plan: €${enAmount} paid upfront, subject to Maxon's regional checkout.`.slice(0,160);
  item.seo.prixMetaDescriptionFr=`Prix de ${c.name} en 2026 : ${frAmount} € par an en EUR, paiement anticipé. Vérifiez les taxes et le pays au panier Maxon.`;
  item.seo.prixMetaDescriptionEn=`${c.name} pricing in 2026: €${enAmount} per year, paid upfront. Check regional pricing and taxes at Maxon checkout.`;
 }
 if(c.free){
  item.seo.prixTitleFr=`${c.name} prix 2026 : gratuit | ToolTrim`;
  item.seo.prixTitleEn=`${c.name} pricing 2026: free | ToolTrim`;
  item.seo.prixMetaDescriptionFr=`${c.name} est gratuit. Vérifie les conditions d'installation et les éventuelles licences des produits associés.`;
  item.seo.prixMetaDescriptionEn=`${c.name} is free. Check installation requirements and any licences needed for related products.`;
 }
}
const lines=(await fs.readFile(path.join(research,'plugin-copy.tsv'),'utf8')).trim().split('\n');
for(const line of lines){
 const [key,name,fr,en]=line.split('\t');
 const match=sourceManifest.find(s=>s.slug===key);const source=match?await read(path.join(research,key+'.json')):null;
 const manual=/^(halftone-dither|ordered-dither|threshold-dither|error-diffuse-dither|custom-dither|palettes)$/.test(key)?docs.find(d=>d.url.endsWith('Stylize_dither-palettes.html')):docs.find(d=>new URL(d.url).pathname.toLowerCase().endsWith('/'+(aliases[key]||key)+'.html'))||docs.find(d=>new URL(d.url).pathname.toLowerCase().endsWith('_'+(aliases[key]||key)+'.html'))||docs.find(d=>new URL(d.url).pathname.toLowerCase().endsWith('-'+(aliases[key]||key)+'.html'));
 const universe=name.startsWith('Universe ');const parent=universe?'red-giant-universe':'ae-red-giant';const family=universe?'Universe':'Red Giant';
 const specific=source?.paragraphs?.filter(s=>!s.startsWith('STAY')&&!s.startsWith('Their success')).length>=1 && !source.title.startsWith('Video Transitions');
 if(!specific&&!manual){blocked.push({key,reason:'No specific source'});continue;}
 const images=specific?cleanImages(source.images):cleanImages(manual.images);
 if(images.length<2){blocked.push({key,reason:'Fewer than two specific official images'});continue;}
 const slug=(universe?'universe-':'red-giant-')+key.replace(/-tool$/,'');
 const url=specific?source.sourceUrl:manual.url;
 const category=(manual?.url.match(/html\/([^/_]+)[_-]/)?.[1]||source?.sourceUrl.split('/').at(-2)||'effects').toLowerCase();
 const transition=category==='transitions';
 const item={...base(slug,name,url),bundle_parent:parent,host_app:universe?null:'adobe-after-effects',shortDescription:fr,shortDescriptionEn:en,
 longDescription:`${name} est un plugin de ${family} destiné à la postproduction. Sa fonction : ${fr.charAt(0).toLowerCase()+fr.slice(1)}\n\n${transition?'Choisis la durée et le rythme de la transition à partir de tes deux plans. Un effet visible peut servir un habillage, mais ne remplace pas un raccord cohérent.':'Compare le résultat aux fonctions déjà présentes dans ton logiciel hôte. Le bon critère est le contrôle obtenu sur un plan réel, pas le nombre de presets disponibles.'}\n\nL'accès passe par ${family}${universe?', également inclus dans Red Giant et Maxon One':', également inclus dans Maxon One'}. Ce n'est pas un achat autonome facturé au prix de la suite. Vérifie la compatibilité du plugin avec la version exacte de ton logiciel. Archive les sources et un rendu final pour ne pas dépendre uniquement d'un projet lié au plugin.`,
 longDescriptionEn:`${name} is a ${family} postproduction plugin. Its purpose: ${en.charAt(0).toLowerCase()+en.slice(1)}\n\n${transition?'Choose transition timing around your two shots. A conspicuous effect can support branded motion graphics but does not replace a coherent edit.':'Compare the result with functions already available in your host. Judge control over a real shot rather than the number of available presets.'}\n\nAccess is through ${family}${universe?', also included in Red Giant and Maxon One':', also included in Maxon One'}. This is not a standalone purchase priced at the cost of the suite. Check the plugin against your exact host version. Archive source material and a final render rather than relying only on a plugin-dependent project.`,
 pros:[fr,'Intégration au workflow du logiciel hôte compatible.'],prosEn:[en,'Works within a compatible host workflow.'],cons:['Licence de suite nécessaire ; aucun prix individuel confirmé.','Compatibilité variable selon le plugin et le logiciel hôte.','Projet éditable dépendant de la disponibilité du plugin.'],consEn:['Suite licence required; no individual price confirmed.','Compatibility varies by plugin and host application.','Editable projects depend on plugin availability.'],useCases:[fr],useCasesEn:[en],verdict:{keepIf:[fr,'Cette fonction revient dans tes projets et ta licence de suite la couvre.'],avoidIf:['Un effet natif répond déjà au besoin.'],threshold:'Teste un plan réel avec la version exacte de ton logiciel avant de souscrire à une suite.'},verdictEn:{keepIf:[en,'This function recurs in your projects and your suite licence includes it.'],avoidIf:['A native effect already meets the need.'],threshold:'Test a real shot in your exact host version before subscribing to a suite.'},alternatives:[],pricing:{free:'Essai de la suite, pas une version gratuite permanente.',paid:`Inclus dans ${family}. Licence de suite requise ; pas de tarif autonome confirmé.`},pricingEn:{free:'Suite trial, not a permanent free edition.',paid:`Included in ${family}. Suite licence required; no standalone price confirmed.`}};
 item.covers=[`maxon-effect:${key}`];item.functional_needs=[`maxon-effect:${key}`];
 item.pricing_v5={...priceBase,official_source_url:url,compare_plan_kind:'included',compare_plan_name:family,price_reliability:'medium',verification_status:'official_explicit',cautions:[item.pricing.paid],plans:[]};item.pricing_v5En={...item.pricing_v5,cautions:[item.pricingEn.paid]};
 item.toolTrimRating=rating([transition?3:4,transition?4:3,3,transition?3:4,2],[fr,'Paramètres documentés ; prise en main non testée.','Fonction spécialisée, utile surtout lorsque ce besoin revient.','Contrôles évalués dans le périmètre de cet effet, pas comme un logiciel complet.','Un rendu final reste partageable ; modifier le projet peut nécessiter le plugin et sa licence.'],[en,'Documented controls; usability not tested.','A specialised function, most relevant for recurring needs.','Controls assessed within this effect’s scope, not as a complete application.','A final render can be shared; editing the project may require the plugin and its licence.']);
 // A suite logo repeated across individual effects suggests a product-specific mark that Maxon has not published.
 attach(item,url,images,null);
}
const ids=new Set(JSON.parse(execFileSync('git',['show','HEAD:src/data/tools_v4.json'],{cwd:root,encoding:'utf8',maxBuffer:32*1024*1024})).map(t=>t.slug));
for(const item of records){const i=catalogue.findIndex(t=>t.slug===item.slug);if(i>=0)catalogue[i]={...catalogue[i],...item};else catalogue.push(item);}
const retired=catalogue.find(t=>t.slug==='pluraleyes');
if(retired){
 retired.bundle_parent=null;retired.defaultMonthlyPrice=null;retired.timeGainedHoursPerMonth=null;retired.lifecycleStatus='retired';
 retired.websiteUrl='https://support.maxon.net/hc/en-us/articles/7389361453340-PluralEyes-Limited-Maintenance-Mode';retired.website=retired.websiteUrl;retired.link=retired.websiteUrl;
 retired.shortDescription='Ancien synchroniseur audio et vidéo de Maxon, en maintenance limitée et indisponible à l’achat.';
 retired.shortDescriptionEn='Former Maxon audio and video synchroniser in limited maintenance and unavailable for new purchase.';
 retired.longDescription='PluralEyes synchronisait automatiquement des rushes audio et vidéo à partir de leurs formes d’onde. Maxon a placé le produit en maintenance limitée le 1er février 2023. Les détenteurs d’une ancienne licence peuvent demander les installateurs compatibles au support.\n\nPour un nouveau montage, vérifie les fonctions de synchronisation de ton logiciel actuel. Ne souscris pas à Red Giant ou Maxon One dans l’espoir d’obtenir une nouvelle licence PluralEyes. Cette fiche documente un produit historique, sans test pratique.';
 retired.longDescriptionEn='PluralEyes synchronised audio and video footage from waveforms. Maxon moved the product into limited maintenance on February 1, 2023. Existing licence holders can request compatible installers through support.\n\nFor a new edit, check the sync features in your current editor. Do not subscribe to Red Giant or Maxon One expecting a new PluralEyes licence. This listing documents a legacy product without hands-on testing.';
 retired.description=retired.longDescription;retired.pricing={free:'Aucun téléchargement public pour les nouveaux utilisateurs.',paid:'Produit arrêté ; aucune nouvelle licence vendue.'};retired.pricingEn={free:'No public download for new users.',paid:'Discontinued; no new licence sold.'};
 retired.pricing_v5={...priceBase,official_source_url:retired.websiteUrl,compare_plan_kind:'discontinued',compare_plan_name:'PluralEyes',price_reliability:'high',location_sensitive:false,verification_status:'official_explicit',cautions:['Produit historique en maintenance limitée. Aucun prix d’abonnement actif à afficher.'],plans:[]};
 retired.pricing_v5En={...retired.pricing_v5,cautions:['Legacy product in limited maintenance. No active subscription price to display.']};
 retired.alternatives=['davinci-resolve','adobe-premiere-pro'].filter(s=>catalogue.some(t=>t.slug===s));
 retired.verdict={keepIf:['Tu dois ouvrir un ancien projet dont la licence PluralEyes fonctionne encore.'],avoidIf:['Tu cherches un nouvel outil de synchronisation.'],threshold:'Pour un nouveau projet, commence par la synchronisation de ton logiciel de montage.'};
 retired.verdictEn={keepIf:['You must open a legacy project with a working PluralEyes licence.'],avoidIf:['You need a new synchronisation tool.'],threshold:'For a new project, start with your editor’s sync function.'};
 changes.push({slug:'pluraleyes',status:'retired-corrected',source:retired.websiteUrl});
}
await fs.writeFile(path.join(root,'src/data/tools_v4.json'),JSON.stringify(catalogue,null,2)+'\n');
await fs.writeFile(path.join(research,'implementation-report.json'),JSON.stringify({updatedOn:date,dependency_status:'approved-fallback',narrative_canon_id:null,narrative_canon_version:null,claims_projection_offset:null,editorialBasis:'ToolTrim editorial guidelines and official Maxon documentation; standalone skill projections unavailable.',added:records.filter(t=>!ids.has(t.slug)).length,updated:records.filter(t=>ids.has(t.slug)).length,changes,blocked},null,2)+'\n');
console.log(JSON.stringify({added:records.filter(t=>!ids.has(t.slug)).length,updated:records.filter(t=>ids.has(t.slug)).length,blocked},null,2));
