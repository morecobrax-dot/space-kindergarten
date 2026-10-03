# Windows' own offline speech recogniser, for tools/voice check.
# Input: a JSON list of { file, phrases }. For each 16 kHz WAV it returns
# what dictation heard, and, when `phrases` is given (the sentence that
# names the letter, once with each of the mission's letters in it), which
# of them it heard — anywhere in the clip, words around it allowed — and
# how sure it was. Output: a JSON list on stdout. Nothing is sent anywhere.
param([string]$List)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$culture = New-Object System.Globalization.CultureInfo 'en-US'
$items = Get-Content -Raw -LiteralPath $List | ConvertFrom-Json
$out = @()
foreach($it in $items){
  $eng = New-Object System.Speech.Recognition.SpeechRecognitionEngine $culture
  $eng.LoadGrammar((New-Object System.Speech.Recognition.DictationGrammar))
  $eng.SetInputToWaveFile($it.file)
  $parts = @()
  while($true){ try{ $r = $eng.Recognize() }catch{ $r = $null }; if($null -eq $r){ break }; $parts += $r.Text }
  $eng.Dispose()
  $pick = -1; $conf = 0
  if($it.phrases){
    $eng = New-Object System.Speech.Recognition.SpeechRecognitionEngine $culture
    $choices = New-Object System.Speech.Recognition.Choices
    $k = 0
    foreach($p in $it.phrases){
      $v = New-Object System.Speech.Recognition.SemanticResultValue ([string]$p), ([int]$k)
      $choices.Add($v.ToGrammarBuilder()); $k++
    }
    $gb = New-Object System.Speech.Recognition.GrammarBuilder
    $gb.Culture = $culture
    $gb.AppendWildcard()
    $gb.Append((New-Object System.Speech.Recognition.SemanticResultKey 'letter', $choices))
    $gb.AppendWildcard()
    $eng.LoadGrammar((New-Object System.Speech.Recognition.Grammar $gb))
    $eng.SetInputToWaveFile($it.file)
    # Utterance by utterance to the end of the file; the most confident match wins.
    for($i = 0; $i -lt 12; $i++){
      try{ $r = $eng.Recognize() }catch{ break }
      if($null -ne $r -and $r.Semantics.ContainsKey('letter') -and $r.Confidence -gt $conf){ $pick = [int]$r.Semantics['letter'].Value; $conf = $r.Confidence }
    }
    $eng.Dispose()
  }
  $out += [pscustomobject]@{ text = ($parts -join ' '); pick = $pick; pickConfidence = $conf }
}
ConvertTo-Json -InputObject @($out) -Compress
