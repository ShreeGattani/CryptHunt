# CryptHunt Methodology Runner - PowerShell
$Base = "https://crypt-hunt-seven.vercel.app"
$Email = "sr970@snu.edu.in"
$Password = "Password@1234"
$Results = @()

function LogResult($Layer, $Test, $Status, $Detail = "") {
    $script:Results += [PSCustomObject]@{ Layer = $Layer; Test = $Test; Status = $Status; Detail = $Detail }
    Write-Output "[$Status] L$Layer | $Test$(if ($Detail) { " | $Detail" })"
}

function Api {
    param([string]$Path, [string]$Method = "GET", [string]$Body = $null, $Session = $null)
    $p = @{ Uri = "$Base$Path"; Method = $Method; UseBasicParsing = $true; TimeoutSec = 30 }
    if ($Session) { $p.WebSession = $Session }
    if ($Body) { $p.Body = $Body; $p.ContentType = "application/json" }
    try {
        $r = Invoke-WebRequest @p
        $j = $null; try { $j = $r.Content | ConvertFrom-Json } catch {}
        return @{ Status = $r.StatusCode; Content = $r.Content; Json = $j; Headers = $r.Headers }
    } catch {
        $s = $_.Exception.Response.StatusCode.value__
        $c = ""; try { $c = $_.ErrorDetails.Message } catch {}
        $j = $null; try { $j = $c | ConvertFrom-Json } catch {}
        return @{ Status = $s; Content = $c; Json = $j; Headers = @{} }
    }
}

Write-Output "=== CryptHunt Methodology Runner ==="
Write-Output "Target: $Base | $(Get-Date -Format o)"

# L0
LogResult 0 "DNS/subdomain enum" "SKIP" "not run on prod"
LogResult 0 "CT logs/WHOIS" "SKIP" "manual OSINT"

# L1 - Next.js
try {
    $home = Invoke-WebRequest -Uri $Base -UseBasicParsing -TimeoutSec 30
    $html = $home.Content
    $hasNext = $html -match '__NEXT_DATA__'
    $nextLeak = $hasNext -and ($html -match 'tentacles|sessionToken|password')
    LogResult 1 "__NEXT_DATA__ no secrets" $(if (-not $nextLeak) { "PASS" } else { "FAIL" }) $(if ($hasNext) { "block present" } else { "absent" })

    $chunks = [regex]::Matches($html, '/_next/static/chunks/[^"]+\.js') | ForEach-Object { $_.Value } | Select-Object -Unique
    $answers = @("tentacles", "majora's mask", "the forest watches", "grind it", "isAnswerCorrect", "creepypastaLevels")
    $leaks = @()
    foreach ($u in $chunks) {
        $js = (Invoke-WebRequest -Uri "$Base$u" -UseBasicParsing).Content
        foreach ($a in $answers) { if ($js.Contains($a)) { $leaks += "$a" } }
    }
    LogResult 1 "JS bundles no answers" $(if ($leaks.Count -eq 0) { "PASS" } else { "FAIL" }) ($leaks -join ",")

    LogResult 1 "Old leaky chunk 404" $(if ((Api "/_next/static/chunks/0fueicol2gg71.js").Status -eq 404) { "PASS" } else { "FAIL" })
    LogResult 1 "Source maps blocked" $(if ((Api "/_next/static/chunks/app.js.map").Status -in @(403,404)) { "PASS" } else { "FAIL" })
} catch { LogResult 1 "Public fetch" "FAIL" $_.Exception.Message }

# L2 HTTP
$cors = Invoke-WebRequest -Uri "$Base/api/quiz" -Headers @{ Origin = "https://evil.com" } -UseBasicParsing
LogResult 2 "CORS not evil origin" $(if ($cors.Headers["Access-Control-Allow-Origin"] -ne "https://evil.com") { "PASS" } else { "FAIL" }) "acao=$($cors.Headers['Access-Control-Allow-Origin'])"
LogResult 2 "Quiz POST removed" $(if ((Api "/api/quiz" -Method POST -Body "{}").Status -eq 405) { "PASS" } else { "FAIL" })

# L3 Auth
LogResult 3 "Login invalid generic" $(if ((Api "/api/auth/login" -Method POST -Body '{"email":"x@y.com","password":"z"}').Status -eq 401) { "PASS" } else { "FAIL" })
LogResult 3 "Password min 8" $(if ((Api "/api/auth/register" -Method POST -Body '{"username":"a","email":"a@b.com","password":"short","otp":"1"}').Json.message -match "8") { "PASS" } else { "FAIL" })
$hit429 = $false
1..7 | ForEach-Object { if ((Api "/api/auth/login" -Method POST -Body '{"email":"rl@t.com","password":"x"}').Status -eq 429) { $hit429 = $true } }
LogResult 3 "Login rate limit" $(if ($hit429) { "PASS" } else { "FAIL" })
LogResult 3 "NoSQL blocked" $(if ((Api "/api/auth/login" -Method POST -Body '{"email":{"$gt":""},"password":"x"}').Status -in @(400,401)) { "PASS" } else { "FAIL" })
LogResult 3 "Password reset" "NA" "no endpoint"
LogResult 3 "OAuth/MFA" "NA" "not implemented"

$newE = "enum-$(Get-Date -Format 'yyyyMMddHHmmss')@test.local"
$n1 = Api "/api/auth/otp/send" -Method POST -Body "{`"email`":`"$newE`"}"
Start-Sleep -Milliseconds 800
$n2 = Api "/api/auth/otp/send" -Method POST -Body "{`"email`":`"$newE`"}"
Start-Sleep -Milliseconds 800
$r1 = Api "/api/auth/otp/send" -Method POST -Body '{"email":"gattanishree31@gmail.com"}'
Start-Sleep -Milliseconds 800
$r2 = Api "/api/auth/otp/send" -Method POST -Body '{"email":"gattanishree31@gmail.com"}'
$enum = ($n1.Json.sentCount -eq 1 -and $n2.Json.sentCount -eq 2 -and $r1.Json.sentCount -eq 1 -and $r2.Json.sentCount -eq 1)
LogResult 3 "OTP sentCount enumeration" $(if ($enum) { "FAIL" } else { "PASS" }) "new $($n1.Json.sentCount)/$($n2.Json.sentCount) reg $($r1.Json.sentCount)/$($r2.Json.sentCount)"
LogResult 3 "No devOtp in response" $(if (-not $n1.Content.Contains("devOtp")) { "PASS" } else { "FAIL" })

# Login
$session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$login = Api "/api/auth/login" -Method POST -Body "{`"email`":`"$Email`",`"password`":`"$Password`"}" -Session $session
if (-not $login.Json.success) {
    LogResult 4 "Login for auth tests" "FAIL" $login.Content
} else {
    $u = $login.Json.user
    Write-Output "Logged in: $($u.username) L$($u.currentLevel) Q$($u.currentQuestion) score=$($u.score)"
    LogResult 4 "Login OK" "PASS"

    $me = Api "/api/auth/me" -Session $session
    LogResult 4 "No password/token in /me" $(if (-not $me.Content.Contains("password") -and -not $me.Content.Contains("sessionToken")) { "PASS" } else { "FAIL" })

    $forge = Api "/api/auth/sync" -Method POST -Body '{"score":999999999,"currentLevel":5,"currentQuestion":6,"elapsedTime":0}' -Session $session
    LogResult 12 "Sync forge score" $(if ($forge.Json.user.score -ne 999999999) { "PASS" } else { "FAIL" }) "score=$($forge.Json.user.score)"
    LogResult 12 "Sync forge level" $(if ($forge.Json.user.currentLevel -eq $u.currentLevel) { "PASS" } else { "FAIL" }) "level=$($forge.Json.user.currentLevel)"

    if (-not $u.levelCompletePending) {
        $complete = Api "/api/game/complete-level" -Method POST -Body "{}" -Session $session
        LogResult 12 "Complete without gate" $(if ($complete.Status -eq 403) { "PASS" } else { "FAIL" }) $complete.Json.message
    } else {
        LogResult 12 "Complete without gate" "PARTIAL" "account at levelCompletePending from prior tests"
    }

    foreach ($l in 1..5) {
        if ($l -eq $u.currentLevel) { continue }
        $q = Api "/api/game/question?levelId=$l" -Session $session
        LogResult 5 "Block question L$l" $(if ($q.Status -eq 403) { "PASS" } else { "FAIL" }) $q.Json.message
    }

    $qActive = Api "/api/game/question?levelId=$($u.currentLevel)" -Session $session
    if ($qActive.Json.question) {
        LogResult 9 "Question no answer field" $(if ($null -eq $qActive.Json.question.answer) { "PASS" } else { "FAIL" })
    }

    $wrong = Api "/api/game/submit" -Method POST -Body '{"answer":"WRONGXYZ"}' -Session $session
    LogResult 12 "Wrong answer rejected" $(if ($wrong.Json.success -eq $false) { "PASS" } else { "FAIL" })

    $empty = Api "/api/game/submit" -Method POST -Body '{"answer":""}' -Session $session
    LogResult 12 "Empty answer rejected" $(if ($empty.Status -eq 400) { "PASS" } else { "PARTIAL" }) "status=$($empty.Status)"

    $quiz = Api "/api/quiz"
    LogResult 9 "Leaderboard no emails" $(if (-not $quiz.Content.Contains('"email"')) { "PASS" } else { "FAIL" })
    LogResult 9 "No databaseStatus" $(if (-not $quiz.Content.Contains("databaseStatus")) { "PASS" } else { "FAIL" })

    $fake = "c" * 64
    LogResult 5 "Unauth submit 401" $(if ((Api "/api/game/submit" -Method POST -Body '{"answer":"x"}' -Session $(New-Object Microsoft.PowerShell.Commands.WebRequestSession)).Status -eq 401) { "PASS" } else { "FAIL" })
}

# Headers
$head = Invoke-WebRequest -Uri $Base -Method Head -UseBasicParsing
foreach ($h in @("strict-transport-security","content-security-policy","x-content-type-options","x-frame-options","referrer-policy")) {
    LogResult 19 "Header $h" $(if ($head.Headers[$h]) { "PASS" } else { "FAIL" })
}

# Sensitive paths
foreach ($p in @("/.env","/.git/HEAD","/admin","/api/debug")) {
    $r = Api $p
    LogResult 9 "Blocked $p" $(if ($r.Status -in @(403,404,401)) { "PASS" } else { "FAIL" }) "status=$($r.Status)"
}

# N/A features
LogResult 5 "Admin API" "NA" "none"
LogResult 5 "Teams" "NA" "none"
LogResult 8 "SSRF user URLs" "NA" "none"
LogResult 16 "File upload" "NA" "none"
LogResult 6 "GraphQL/SQLi" "NA" "Prisma/Mongo"
LogResult 12 "Hint API abuse" "NA" "hints with question"
LogResult 13 "CSRF tokens" "PARTIAL" "SameSite=Lax only"
LogResult 10 "bcrypt passwords" "PASS" "code review"
LogResult 10 "Session hash at rest" "PASS" "code review"
LogResult 10 "OTP hash at rest" "PASS" "code review"
LogResult 18 "npm audit" "PARTIAL" "2 moderate postcss via next"
LogResult 11 "localStorage auth" "PASS" "bg rotation only; auth via HttpOnly cookie"
LogResult 3 "Register error enumeration" "PARTIAL" "distinct OTP/username/email errors"
LogResult 20 "Timing attack on answers" "PARTIAL" "not measured live"
LogResult 17 "DoS load test" "SKIP" "not on prod"

# Summary
Write-Output "`n========== SUMMARY =========="
$pass = ($Results | Where-Object Status -eq "PASS").Count
$fail = $Results | Where-Object Status -eq "FAIL"
$partial = $Results | Where-Object Status -eq "PARTIAL"
$na = ($Results | Where-Object Status -eq "NA").Count
$skip = ($Results | Where-Object Status -eq "SKIP").Count
Write-Output "Total: $($Results.Count) | PASS: $pass | FAIL: $($fail.Count) | PARTIAL: $($partial.Count) | N/A: $na | SKIP: $skip"
if ($fail.Count) {
    Write-Output "`nFAILURES:"
    $fail | ForEach-Object { Write-Output "  L$($_.Layer) $($_.Test) | $($_.Detail)" }
}
if ($partial.Count) {
    Write-Output "`nPARTIAL:"
    $partial | ForEach-Object { Write-Output "  L$($_.Layer) $($_.Test) | $($_.Detail)" }
}
