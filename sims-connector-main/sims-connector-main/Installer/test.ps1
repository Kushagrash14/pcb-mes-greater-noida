$path = "D:\ICT\TestFCT_Test6.txt"

# Create first part
"startime:2026/08/22 10:00:00" | Out-File -FilePath $path

Start-Sleep -Milliseconds 500

# Add machine info
"machine:FCT-MACHINE" | Add-Content -Path $path

Start-Sleep -Milliseconds 500

# Add serial number
"SN:SNTEST123456" | Add-Content -Path $path

Start-Sleep -Milliseconds 1000

# Add CVTE JSON data
'{"WorkerNo":"IndiaPG","TestStartDate":"2026-08-22 10:00:00","LotSnCode":"SNTEST123456"}' | Add-Content -Path $path

Start-Sleep -Milliseconds 1000

# Add result flag
'"isPass":true' | Add-Content -Path $path

Start-Sleep -Milliseconds 1000

# Final result
"TestResult:PASS" | Add-Content -Path $path