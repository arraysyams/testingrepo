// Cek update setiap 5s /done
// Konten teks hanya akan direfresh jika ada yang berubah / ada masalah
// Akan ada variabel baru sebagai pembanding /done
// Jika data gagal diakses, tampilkan teks berisi pesan offline
// Bagaimana cara minta izin autoplay dari browser?
// Tombol untuk refresh data manual (keperluan debug)
// Placeholder gambar
// Link json untuk testing perubahan: https://raw.githubusercontent.com/arraysyams/testingrepo/main/autogempa.json
// Link json dari bmkg: https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json
// Lokasi shakemap: https://data.bmkg.go.id/DataMKG/TEWS/$Shakemap
var fetch_json = new XMLHttpRequest();
var fetch_xml = new XMLHttpRequest();
var sumberData = "https://bmkg-content-inatews.storage.googleapis.com/datagempa.json";
var dataGempa;
var cekData = "";
var txtDetail = document.getElementById("informasi");
var tblDetail = document.getElementsByClassName("tblGempa");
var imgDetail = document.getElementById("imgShakemap")
var txtLog = document.getElementById("txtLog");
var audWarn = document.getElementById("Warning")
var audAlert = document.getElementById("Alert")
var divRecent = document.getElementById("div-riwayat")
var timeRefresh; // Variabel yg akan ditempati timer
var interval = 2500; // Jeda waktu dalam milisekon sebelum refresh
var firstState = true;

// Function untuk menguji coba perubahan data (keperluan debug)
function ubahData (data) {
    switch (data) {
        case 1:
        default:
        sumberData = "https://bmkg-content-inatews.storage.googleapis.com/datagempa.json";
        break;
        
        case 2:
        sumberData = "https://raw.githubusercontent.com/arraysyams/testingrepo/main/datagempa%20-%20inatews%20gempa%20normal.json";
        break;
    }
}

function matchMultiple(text, arraymatches) {
    let found = false;
    for (let i = 0; i < arraymatches.length; i++) {
        let regex = new RegExp("\\b" + arraymatches[i] + "\\b", "gmi");
        if(text.match(regex)) {
            found = true;
        }
    }
    return found;
}

function statusUpdate (text) {
    txtLog.textContent = text;
}

function displayUpdate (dtGempa) {
//     let out = "Gempa bermagnitudo " + dtGempa.magnitude + " terjadi pada pukul " + dtGempa.time + " (" + dtGempa.date + "). " + dtGempa.area + ". " + dtGempa.instruction;
    let out = "Gempa Mag:" + dtGempa.magnitude + ", " + dtGempa.date + " " + dtGempa.time + ", Lok:" + dtGempa.latitude + "," + dtGempa.longitude + " (" + dtGempa.area + "), Kedalaman:" + dtGempa.depth + ", " + dtGempa.instruction;
    
    txtDetail.textContent = out;

    tblDetail.Bujur.textContent = dtGempa.longitude;
    tblDetail.Coordinates.textContent = dtGempa.point.coordinates;
    tblDetail.DateTime.textContent = dtGempa.timesent;
    tblDetail.Dirasakan.textContent = dtGempa.felt;
    tblDetail.Jam.textContent = dtGempa.time;
    tblDetail.Kedalaman.textContent = dtGempa.depth;
    tblDetail.Lintang.textContent = dtGempa.latitude;
    tblDetail.Magnitude.textContent = dtGempa.magnitude;
    tblDetail.Potensi.textContent = dtGempa.instruction;
    tblDetail.Tanggal.textContent = dtGempa.date;
    tblDetail.Wilayah.textContent = dtGempa.area;
    
    let locGambar;
    let subject = dtGempa.subject.split(".")[0]
    if (matchMultiple(subject, ["PD-1", "PD-2", "PD-3"]) || subject == "Gempa M>5") {
        locGambar = "https://bmkg-content-inatews.storage.googleapis.com/" + dtGempa.eventid + ".gif"
    } else {
        locGambar = "https://data.bmkg.go.id/DataMKG/TEWS/" + dtGempa.shakemap;
    }

    imgDetail.src = locGambar;
}

function autoUpdater() {
    statusUpdate("Mengecek pembaruan...");
    fetchUpdate();

    timeRefresh = setTimeout(autoUpdater, interval);
}

function fetchUpdate() {
    fetch_json.open("GET", sumberData + "?t=" + Date.now(), true);
    fetch_json.send();
}

fetch_json.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        let stringData = JSON.stringify(this.responseText)
        if(cekData != stringData){
            cekData = stringData;
            dataGempa = JSON.parse(this.responseText);
            let mag = parseFloat(dataGempa.info.magnitude);
            displayUpdate(dataGempa.info);
            fetch_xml.open("GET", "https://bmkg-content-inatews.storage.googleapis.com/last30event.xml", true);
            if (firstState) {
                statusUpdate("Berhasil memuat data")
                firstState = false
            } else {
                if (mag >= 6) { audAlert.play() } else { audWarn.play() }
                statusUpdate("Ada update");
            }
            fetch_xml.send();
        } else {
            statusUpdate("Selesai");
        };

    } else if (this.status == 404) {
        statusUpdate("Tidak bisa mengakses file: 404")
    } else {
        statusUpdate("Sedang mengupdate... " + this.readyState + "/" + this.status)
    }
}

fetch_json.onerror = function() {
    statusUpdate("Kesalahan jaringan?");
}

fetch_xml.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        let out = '';/** = '<div class="d-flex py-3 px-0 text-dark"> Disclaimer!:Merupakan informasi gempabumi yang didiseminasikan dalam waktu kurang dari 5 menit setelah kejadian gempa melalui multi-moda penyebaran informasi  antara lain: SMS, App Seluler, E-mail, Fax, Website, WRS, GTS dan Sosial Media. Informasi ini merupakan informasi gempabumi secara cepat dari InaTEWS. Tidak akan ada pemutakhiran parameter gempabumi dan parameter gempabumi yang final boleh jadi berbeda.</div>'*/
        let info = this.responseXML.getElementsByTagName("info");
        for (i = 0; i < info.length; i++) {
            // let n = info[i].getElementsByTagName("subject")[0].childNodes[0].nodeValue;
            out += "<p>";
            out += info[i].getElementsByTagName("date")[0].childNodes[0].nodeValue;
            out += "&nbsp;";
            out += info[i].getElementsByTagName("time")[0].childNodes[0].nodeValue;
            out += "&nbsp;|&nbsp;M";
            out += info[i].getElementsByTagName("magnitude")[0].childNodes[0].nodeValue;
            out += ";&nbsp;Kedalaman:&nbsp;";
            out += info[i].getElementsByTagName("depth")[0].childNodes[0].nodeValue;
            out += ";&nbsp;";
            out += info[i].getElementsByTagName("area")[0].childNodes[0].nodeValue;
            out += "</p>";
            // let d = 578;
            // out += '<a  href="detail?name=' + info[i].getElementsByTagName("eventid")[0].childNodes[0].nodeValue + "&day=" + d + '"><div class="d-flex flex-row text-black align-items-start text-left border-1" style="border-bottom-style: solid!important;border-bottom-width: thin; background-color:#9A0101; border-bottom-color: coral;"> <div class="col-lg-2 col-sm-3  p-1 bg-secondary " id="mm" style="background-color:#9A0101!important" ><div class="card card-body text-black p-0 border-0" style="background-color:rgb(0,0,0,0)!important"><p style="margin-bottom:0px; color:#FFA858; text-align:center"> Magnitudo</p><h2 style=" text-align:center; font-size:320%; margin-top:0px; color:#FFA858; font-weight:bold !important" id="">' + info[i].getElementsByTagName("magnitude")[0].childNodes[0].nodeValue + '</h2></div></div> <div class="col-lg-10 col-sm-9  p-0 bg-secondary border-0" id="" style="border-style: solid;background-color:white!important"> <div class="card card-body bg-none text-black py-1 border-0" style="background-color:rgb(0, 0, 0,0)!important"><p class="text-black" style="color:black; margin-bottom:0; font-weight:bold">' + info[i].getElementsByTagName("subject")[0].childNodes[0].nodeValue.toUpperCase() + '</p><p class="text-black" style="color:black; margin-bottom:0; font-weight:bold">' + info[i].getElementsByTagName("date")[0].childNodes[0].nodeValue + " " + info[i].getElementsByTagName("time")[0].childNodes[0].nodeValue + '</p><p class="text-black" style="color:black; font-size:90%; margin-bottom:0; font-weight:normal"> Pusat Gempabumi ' + info[i].getElementsByTagName("area")[0].childNodes[0].nodeValue + '</p>  <p class="text-black" style="color:black; margin-bottom:0; font-weight:normal">Kedalaman : ' + info[i].getElementsByTagName("depth")[0].childNodes[0].nodeValue + "</p></div></div></div></a>"
        }
        divRecent.innerHTML = out;
    } else if (this.status == 404) {
        statusUpdate("Tidak bisa mengakses file xml: 404")
    } else {
        statusUpdate("Sedang mengupdate xml... " + this.readyState + "/" + this.status)
    }
}


// Mentrigger pengambilan data setelah halaman dimuat
fetchUpdate()
autoUpdater()
