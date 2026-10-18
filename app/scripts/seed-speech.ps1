$ErrorActionPreference = 'Stop'
$seedFolder = Join-Path $PSScriptRoot '..\data\seed'
New-Item -ItemType Directory -Path $seedFolder -Force | Out-Null
Add-Type -AssemblyName System.Speech
Add-Type -ReferencedAssemblies System.Speech -TypeDefinition @'
using System;
using System.Collections.Generic;
using System.Speech.Synthesis;
public class SeedWord { public string word; public double start; }
public class TalkCutNarration {
  public static List<SeedWord> Make(string text, string filename) {
    var words = new List<SeedWord>();
    using(var speech = new SpeechSynthesizer()) {
      speech.Rate = -1;
      foreach(var voice in speech.GetInstalledVoices()) {
        if(voice.VoiceInfo.Name.Contains("Zira")) { speech.SelectVoice(voice.VoiceInfo.Name); break; }
      }
      speech.SetOutputToWaveFile(filename);
      speech.SpeakProgress += (s,e) => {
        words.Add(new SeedWord { word = text.Substring(e.CharacterPosition, e.CharacterCount), start = e.AudioPosition.TotalSeconds });
      };
      speech.Speak(text);
      speech.SetOutputToNull();
    }
    return words;
  }
}
'@
$narrationText = "Every great story starts with a simple idea. But the magic happens in the edit. When we give an idea a little room to breathe, something interesting happens. Um, we stop trying to say everything, and start saying something that matters. So take a breath. Cut the extra words. Keep the moments that feel like you. Because the best version of your story is already in there. Let's bring it out."
$outputWave = [System.IO.Path]::GetFullPath((Join-Path $seedFolder 'narration.wav'))
$words = [TalkCutNarration]::Make($narrationText, $outputWave)
$words | ConvertTo-Json -Depth 3 | Set-Content -LiteralPath (Join-Path $seedFolder 'words.json') -Encoding UTF8
Write-Output "Created demo narration with $($words.Count) word markers."
