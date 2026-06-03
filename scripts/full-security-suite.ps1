# CryptHunt production exploit test suite (PowerShell)
# Usage: .\scripts\full-security-suite.ps1

$Base = "https://crypt-hunt-seven.vercel.app"
$Email = "sr970@snu.edu.in"
$Password = "Password@1234"
$Results = @()

function Record($Category, $Name, $Pass, $Detail = "") {
    $script:Results += [PSCustomObject]@{ Category = $Category; Name = $Name; Pass = $Pass; Detail = $Detail }
    $icon = if ($Pass) { "PASS" } else { "FAIL" }
    if ($Detail) { Write-Output "[$icon] $Category :: $Name - $Detail" } else { Write-Output "[$icon] $Category :: $Name" }
}

function Invoke-Api {
    param(
        [string]$Path,
        [string]$Method = "GET",
        [string]$Body = $null,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session = $null
    )
    $params = @{
        Uri = "$Base$Path"
        Method = $Method
        UseBasicParsing = $true
        TimeoutSec = 30
    }
    if ($Session) { $params.WebSession = $Session }
    if ($Body) {
        $params.Body = $Body
        $params.ContentType = "application/json"
    }
    try {
        $r = Invoke-WebRequest @params
        $json = $null
        try { $json = $r.Content | ConvertFrom-Json } catch {}
        return @{ Status = $r.StatusCode; Content = $r.Content; Json = $json; Error = $null }
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        $content = ""
        try { $content = $_.ErrorDetails.Message } catch {}
        $json = $null
        try { $json = $content | ConvertFrom-Json } catch {}
        return @{ Status = $status; Content = $content; Json = $json; Error = $_.Exception.Message }
    }
}

Write-Output "`n========== PUBLIC SURFACE =========="
$quiz = Invoke-Api "/api/quiz"
Record "Public" "Quiz no emails" (-not $quiz.Content.Contains('"email"'))
Record "Public" "Quiz no databaseStatus" (-not $quiz.Content.Contains("databaseStatus"))
Record "Public" "Quiz POST removed" ((Invoke-Api "/api/quiz" -Method POST -Body "{}").Status -eq 405)
Record "Public" "Old leaky chunk 404" ((Invoke-Api "/_next/static/chunks/0fueicol2gg71.js").Status -eq 404)

$html = (Invoke-WebRequest -Uri $Base -UseBasicParsing).Content
$chunks = [regex]::Matches($html, '/_next/static/chunks/[^"]+\.js') | ForEach-Object { $_.Value } | Select-Object -Unique
$answers = @("tentacles", "majora's mask", "the forest watches", "grind it", "jonathan blake", "skintaker")
$leaks = @()
foreach ($u in $chunks) {
    $js = (Invoke-WebRequest -Uri "$Base$u" -UseBasicParsing).Content
    foreach ($a in $answers) { if ($js.Contains($a)) { $leaks += "$a@$u" } }
}
Record "Public" "No answers in JS" ($leaks.Count -eq 0) ($leaks -join "; ")

Write-Output "`n========== UNAUTHENTICATED ABUSE =========="
$fake = "a" * 64
$fakeSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$fakeSession.Cookies.Add((New-Object System.Uri($Base)), (New-Object System.Net.Cookie("crypthunt_session", $fake, "/", "crypt-hunt-seven.vercel.app")))
foreach ($t in @(
    @{ P = "/api/auth/sync"; M = "POST"; B = '{"score":999999999,"currentLevel":5,"currentQuestion":6,"elapsedTime":0}' },
    @{ P = "/api/game/submit"; M = "POST"; B = '{"answer":"tentacles"}' },
    @{ P = "/api/game/complete-level"; M = "POST"; B = '{}' },
    @{ P = "/api/game/question?levelId=1"; M = "GET"; B = $null }
)) {
    $r = Invoke-Api -Path $t.P -Method $t.M -Body $t.B -Session $fakeSession
    Record "Unauth" "$($t.M) $($t.P) rejected" ($r.Status -eq 401)
}

Write-Output "`n========== LOGIN =========="
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$loginBody = "{`"email`":`"$Email`",`"password`":`"$Password`"}"
$login = Invoke-Api -Path "/api/auth/login" -Method POST -Body $loginBody -Session $session
if (-not $login.Json.success) {
    Record "Session" "Login" $false $login.Content
    Write-Output "`nLogin failed - cannot run authenticated tests. Rate limit may be active."
} else {
    $user = $login.Json.user
    Write-Output "Logged in: $($user.username) L$($user.currentLevel) Q$($user.currentQuestion) score=$($user.score) pending=$($user.levelCompletePending)"
    Record "Session" "Login OK" $true

    Write-Output "`n========== AUTHENTICATED EXPLOITS =========="
    $me = Invoke-Api "/api/auth/me" -Session $session
    Record "Session" "Me no password leak" (-not $me.Content.Contains("password") -and -not $me.Content.Contains("sessionToken"))

    $forge = Invoke-Api "/api/auth/sync" -Method POST -Body '{"score":9007194740990991,"currentLevel":5,"currentQuestion":6,"elapsedTime":0}' -Session $session
    Record "Cheat" "Sync forge score blocked" ($forge.Json.user.score -ne 9007194740990991) "score=$($forge.Json.user.score)"
    Record "Cheat" "Sync forge level blocked" ($forge.Json.user.currentLevel -eq $user.currentLevel) "level=$($forge.Json.user.currentLevel)"

    $skip = Invoke-Api "/api/game/complete-level" -Method POST -Body "{}" -Session $session
    Record "Cheat" "Complete-level without gate" ($skip.Status -eq 403) $skip.Json.message

    foreach ($l in 2..5) {
        $q = Invoke-Api "/api/game/question?levelId=$l" -Session $session
        Record "Cheat" "Block question L$l" ($q.Status -eq 403) $q.Json.message
    }

    $empty = Invoke-Api "/api/game/submit" -Method POST -Body '{"answer":""}' -Session $session
    Record "Cheat" "Empty answer rejected" ($empty.Status -eq 400 -or $empty.Json.success -eq $false) "status=$($empty.Status)"

    $huge = Invoke-Api "/api/game/submit" -Method POST -Body ('{"answer":"' + ("z" * 600) + '"}') -Session $session
    Record "Cheat" "Huge answer rejected" ($huge.Status -eq 400 -or $huge.Json.success -eq $false) "status=$($huge.Status)"

    $wrong = Invoke-Api "/api/game/submit" -Method POST -Body '{"answer":"DEFINITELY_WRONG"}' -Session $session
    $afterWrong = Invoke-Api "/api/auth/me" -Session $session
    Record "Cheat" "Wrong answer no advance" ($wrong.Json.success -eq $false) $wrong.Json.message

    $cheatL3 = Invoke-Api "/api/game/submit" -Method POST -Body '{"answer":"majora''s mask"}' -Session $session
    $afterCheat = Invoke-Api "/api/auth/me" -Session $session
    Record "Cheat" "L3 answer while on L$($user.currentLevel) blocked" (-not $cheatL3.Json.success -or $afterCheat.Json.user.currentLevel -eq $user.currentLevel)

    $qActive = Invoke-Api "/api/game/question?levelId=$($user.currentLevel)" -Session $session
    if ($qActive.Json.question) {
        Record "Cheat" "Question has no answer field" ($null -eq $qActive.Json.question.answer) ($qActive.Json.question.PSObject.Properties.Name -join ",")
    }
}

Write-Output "`n========== OTP ENUMERATION =========="
$newEmail = "enum-probe-$(Get-Date -Format 'yyyyMMddHHmmss')@test.local"
$n1 = Invoke-Api "/api/auth/otp/send" -Method POST -Body "{`"email`":`"$newEmail`"}"
Start-Sleep -Seconds 1
$n2 = Invoke-Api "/api/auth/otp/send" -Method POST -Body "{`"email`":`"$newEmail`"}"
Start-Sleep -Seconds 2
$r1 = Invoke-Api "/api/auth/otp/send" -Method POST -Body "{`"email`":`"gattanishree31@gmail.com`"}"
Start-Sleep -Seconds 1
$r2 = Invoke-Api "/api/auth/otp/send" -Method POST -Body "{`"email`":`"gattanishree31@gmail.com`"}"
$enumLeak = ($n1.Json.sentCount -eq 1 -and $n2.Json.sentCount -eq 2 -and $r1.Json.sentCount -eq 1 -and $r2.Json.sentCount -eq 1)
Record "Auth" "OTP sentCount enumeration" (-not $enumLeak) "new=$($n1.Json.sentCount)/$($n2.Json.sentCount) reg=$($r1.Json.sentCount)/$($r2.Json.sentCount) (reg statuses: $($r1.Status)/$($r2.Status))"

Write-Output "`n========== RATE LIMITS =========="
$hit429 = $false
for ($i = 1; $i -le 8; $i++) {
    $r = Invoke-Api "/api/auth/login" -Method POST -Body '{"email":"rl@test.local","password":"x"}'
    if ($r.Status -eq 429) { $hit429 = $true; break }
}
Record "Auth" "Login rate limit 429" $hit429

Write-Output "`n========== SUMMARY =========="
$passed = ($Results | Where-Object { $_.Pass }).Count
$failed = ($Results | Where-Object { -not $_.Pass })
Write-Output "Total: $($Results.Count) | Passed: $passed | Failed: $($failed.Count)"
if ($failed.Count -gt 0) {
    Write-Output "`nFAILURES:"
    $failed | ForEach-Object { Write-Output "  [$($_.Category)] $($_.Name) - $($_.Detail)" }
}
