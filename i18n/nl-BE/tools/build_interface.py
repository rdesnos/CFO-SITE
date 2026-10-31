import json
from inventory import ROOT

labels = {}
for line in (ROOT/'baseline/theme/assets/js/cfo-nl-be-glossary.js').read_text(encoding='utf-8').splitlines():
    value = line.strip().rstrip(',')
    if value.startswith("'") and "':'" in value:
        key, translated = value[1:-1].split("':'",1)
        labels[key] = translated
for kind in ('pages','posts'):
    sources = json.loads((ROOT/f'inventory/{kind}.json').read_text(encoding='utf-8'))
    translated = json.loads((ROOT/f'build/{kind}.json').read_text(encoding='utf-8'))
    by_id = {r['source_id']:r for r in translated}
    for row in sources:
        if row['id'] in by_id and row['title']['raw']:
            labels[row['title']['raw']] = by_id[row['id']]['translated_title']
labels.update({
    'Média libre, indépendant et non officiel.':'Vrij, onafhankelijk en niet-officieel medium.',
    'À l’affiche':'In de kijker', 'À l\'affiche':'In de kijker',
    'À ses côtés':'Aan haar zijde', 'Le tableau de bord':'Het dashboard',
    'Les trajectoires':'De trajecten', 'La carte 3D':'De 3D-kaart',
    'Comment ça marche ?':'Hoe werkt het?',
    'Publié le':'Gepubliceerd op', 'Officiel':'Officieel', 'Professionnel':'Professioneel',
    'Média':'Medium', 'Voir la source →':'Bekijk de bron →',
    'Lire l’actualité →':'Lees het nieuwsbericht →', 'Menu':'Menu', 'Rechercher':'Zoeken',
    'Votre nom':'Uw naam', 'Votre e-mail':'Uw e-mailadres', 'Objet':'Onderwerp',
    'Votre message (facultatif)':'Uw bericht (optioneel)', 'Envoyer':'Verzenden',
    'Merci pour votre message. Il a été envoyé.':'Bedankt voor uw bericht. Het is verzonden.',
    'Veuillez renseigner ce champ.':'Vul dit veld in.',
    'Veuillez saisir votre adresse e-mail.':'Vul uw e-mailadres in.',
    'Un ou plusieurs champs contiennent une erreur. Veuillez vérifier et essayer à nouveau.':'Een of meer velden bevatten een fout. Controleer ze en probeer opnieuw.',
    'Une erreur s’est produite lors de l’envoi de votre message. Veuillez essayer à nouveau plus tard.':'Er is een fout opgetreden bij het verzenden van uw bericht. Probeer het later opnieuw.',
    'Portrait de Marine':'Portret van Marine',
    'Aucune actualité disponible pour le moment.':'Er is momenteel geen nieuws beschikbaar.',
    'Chroniques d’une fille ordinaire Média libre, indépendant et non officiel.':'Chroniques d’une fille ordinaire Vrij, onafhankelijk en niet-officieel medium.',
})
(ROOT/'build/interface-labels.json').write_text(json.dumps(labels,ensure_ascii=False,sort_keys=True,indent=2)+'\n',encoding='utf-8')
target=ROOT/'theme/assets/js/cfo-nl-be-glossary.js'
target.parent.mkdir(parents=True,exist_ok=True)
target.write_text('/* Interface translations are injected server-side from Supabase. */\n',encoding='utf-8')
print(json.dumps({'interface_labels':len(labels)}))
