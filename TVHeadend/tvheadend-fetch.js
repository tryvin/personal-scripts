function getAllMuxes() {
    return fetch('/api/mpegts/mux/grid',
        {
            body: 'start=0&limit=999999999&sort=name&dir=ASC', method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
              'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            }
        }
    ).then(response => response.json())
}

function getAllChannels() {
    return fetch('/api/channel/grid',
        {
            body: 'start=0&limit=999999999&sort=name&dir=ASC', method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
              'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            }
        }
    ).then(response => response.json())
}

function getAllServices() {
    return fetch('/api/mpegts/service/grid',
        {
            body: 'start=0&limit=999999999&sort=name&dir=ASC', method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
              'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            }
        }
    ).then(response => response.json())
}

function createNewMux(muxConf, networkUuid) {
    return fetch('/api/mpegts/network/mux_create',
        {
            body: `uuid=${networkUuid}&conf=${encodeURIComponent(JSON.stringify(muxConf))}`,
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
              'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            }
        }
    ).then(response => response.json())
}

function saveNode(muxConf, muxUuid) {
    muxConf.uuid = muxUuid;

    return fetch('/api/idnode/save',
        {
            body: `node=${encodeURIComponent(JSON.stringify(muxConf))}`,
            method: 'POST',
            credentials: 'include',
            headers: {
              'Accept': 'application/json, application/xml, text/plain, text/html, *.*',
              'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
            }
        }
    ).then(response => response.json())
}

function copyMuxesFromNetwork(networkUuid, networkToUuid, muxMapFunction) {
    getAllMuxes().then((muxList) => {
        var promiseList = muxList.entries.filter((muxItem) => {
            return muxItem.network_uuid == networkUuid;
        }).map((muxItem) => {
            delete muxItem.network_uuid;
            delete muxItem.uuid;
            delete muxItem.onid;
            delete muxItem.network;

            if ( muxMapFunction ) {
                muxItem = muxMapFunction(muxItem);
            }

            return createNewMux(muxItem, networkToUuid);
        })

        return Promise.all(promiseList);
    })
}

function editMuxesFromNetwork(networkUuid, muxMapFunction) {
    getAllMuxes().then((muxList) => {
        var promiseList = muxList.entries.filter((muxItem) => {
            return muxItem.network_uuid == networkUuid
        }).map((muxItem) => {
            if ( muxMapFunction ) {
                muxItem = muxMapFunction(muxItem);
            }

            return saveNode(muxItem, muxItem.uuid);
        })

        return Promise.all(promiseList);
    })
}

//Example
copyMuxesFromNetwork("32cabdc3fcc8588232af11c08990d691", "234531274ad9b6d63587b5bb187a475c", (muxItem) => {
    return {
        "enabled":1,
        "epg":1,
        "iptv_url":muxItem.iptv_url.replace("something", "something"),
        "use_libav":muxItem.use_libav,
        "iptv_atsc":false,
        "iptv_muxname":muxItem.iptv_muxname,
        "channel_number":"0",
        "iptv_sname":muxItem.iptv_sname,
        "scan_state":0,
        "charset":"",
        "priority":0,
        "spriority":0,
        "iptv_substitute":false,
        "iptv_interface":"",
        "iptv_epgid":"",
        "iptv_icon":"",
        "iptv_tags":"",
        "iptv_satip_dvbt_freq":0,
        "iptv_satip_dvbc_freq":0,
        "iptv_satip_dvbs_freq":0,
        "iptv_buffer_limit":0,
        "tsid_zero":true,
        "pmt_06_ac3":0,
        "eit_tsid_nocheck":true,
        "sid_filter":0,
        "iptv_respawn":false,
        "iptv_kill":0,
        "iptv_kill_timeout":5,
        "iptv_env":"",
        "iptv_hdr":""
    }
})

