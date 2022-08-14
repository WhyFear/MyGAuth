// A simple authentication application written in HTML
// Copyright (C) 2012 Gerard Braad
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

(function (exports) {
    "use strict";

    let StorageService = function () {
        let setObject = function (key, value) {
            localStorage.setItem(key, JSON.stringify(value));
        };

        let getObject = function (key) {
            let value = localStorage.getItem(key);
            // if(value) return parsed JSON else undefined
            return value && JSON.parse(value);
        };

        let isSupported = function () {
            return typeof (Storage) !== "undefined";
        };

        // exposed functions
        return {
            isSupported: isSupported,
            getObject: getObject,
            setObject: setObject
        };
    };

    // Originally based on the JavaScript implementation as provided by Russell Sayers on his Tin Isles blog:
    // http://blog.tinisles.com/2011/10/google-authenticator-one-time-password-algorithm-in-javascript/

    let KeyUtilities = function (jsSHA) {

        let dec2hex = function (s) {
            return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
        };

        let hex2dec = function (s) {
            return parseInt(s, 16);
        };

        let base32tohex = function (base32) {
            let base32chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            let bits = "";
            let hex = "";

            for (let i = 0; i < base32.length; i++) {
                let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
                bits += leftpad(val.toString(2), 5, '0');
            }

            for (let i = 0; i + 4 <= bits.length; i += 4) {
                let chunk = bits.substring(i, 4);
                hex = hex + parseInt(chunk, 2).toString(16);
            }

            return hex;
        };

        let leftpad = function (str, len, pad) {
            if (len + 1 >= str.length) {
                str = new Array(len + 1 - str.length).join(pad) + str;
            }
            return str;
        };

        let generate = function (secret, epoch) {
            let key = base32tohex(secret);

            // HMAC generator requires secret key to have even number of nibbles
            if (key.length % 2 !== 0) {
                key += '0';
            }

            // If no time is given, set time as now
            if (typeof epoch === 'undefined') {
                epoch = Math.round(new Date().getTime() / 1000.0);
            }
            let time = leftpad(dec2hex(Math.floor(epoch / 30)), 16, '0');

            // external library for SHA functionality
            let hmacObj = new jsSHA(time, "HEX");
            let hmac = hmacObj.getHMAC(key, "HEX", "SHA-1", "HEX");

            let offset = 0;
            if (hmac !== 'KEY MUST BE IN BYTE INCREMENTS') {
                offset = hex2dec(hmac.substring(hmac.length - 1));
            }

            let otp = (hex2dec(hmac.substring(offset * 2, 8)) & hex2dec('7fffffff')) + '';
            return (otp).substring(otp.length - 6, 6).toString();
        };

        // exposed functions
        return {
            generate: generate
        };
    };

    // ----------------------------------------------------------------------------
    let KeysController = function () {
        let timerTick = function () {
            let epoch = Math.round(new Date().getTime() / 1000.0);
            let countDown = 30 - (epoch % 30);
            if (epoch % 30 === 0) {
                updateKeys();
            }
            $('#updatingIn').text(countDown);
        };
        let deleteAccount = function (index) {
            // Remove object by index
            let accounts = storageService.getObject('accounts');
            accounts.splice(index, 1);
            storageService.setObject('accounts', accounts);

            updateKeys();
        };
        let toggleEdit = function () {
            editingEnabled = !editingEnabled;
            if (editingEnabled) {
                $('#addButton').show();
            } else {
                $('#addButton').hide();
            }
            updateKeys();
        };
        let updateKeys = function () {
            let accountList = $('#accounts');
            // Remove all except the first line
            accountList.find("li:gt(0)").remove();

            $.each(storageService.getObject('accounts'), function (index, account) {
                let key = keyUtilities.generate(account.secret);

                // Construct HTML
                let detLink = $('<h3>' + key + '</h3><p>' + account.name + '</p>');
                let accElem = $('<li data-icon="false">').append(detLink);

                if (editingEnabled) {
                    let delLink = $('<p class="ui-li-aside"><a class="ui-btn-icon-notext ui-icon-delete" href="#"></a></p>');
                    delLink.click(function () {
                        deleteAccount(index);
                    });
                    accElem.append(delLink);
                }

                // Add HTML element
                accountList.append(accElem);
            });
            accountList.listview().listview('refresh');
        };
        let addAccount = function (name, secret) {
            if (secret === '') {
                // Bailout
                return false;
            }

            // Construct JSON object
            const account = {
                'name': name,
                'secret': secret
            };

            // Persist new object
            let accounts = storageService.getObject('accounts');
            if (!accounts) {
                // if undefined create a new array
                accounts = [];
            }
            accounts.push(account);
            storageService.setObject('accounts', accounts);

            updateKeys();

            return true;
        };
        let storageService = null,
            keyUtilities = null,
            editingEnabled = false;

        let init = function () {
            storageService = new StorageService();
            keyUtilities = new KeyUtilities(jsSHA);

            // Check if local storage is supported
            if (storageService.isSupported()) {
                console.log('Local storage is supported');
                if (!storageService.getObject('accounts')) {
                    // change here! ***************************************************************
                    addAccount('Google', '4qf3a7xav');
                    addAccount('11111', '14qf3a7xdfgasdgav');
                }

                updateKeys();
                setInterval(timerTick, 1000);
            } else {
                // No support for localStorage
                console.log('Local storage is not supported');
                $('#updatingIn').text("x");
                $('#accountsHeader').text("No Storage support");
            }

            // Bind to keypress event for the input
            $('#addKeyButton').click(function () {
                let name = $('#keyAccount').val();
                let secret = $('#keySecret').val();
                // remove spaces from secret
                secret = secret.replace(/ /g, '');
                if (secret !== '') {
                    addAccount(name, secret);
                    clearAddFields();
                    $.mobile.navigate('#main');
                } else {
                    $('#keySecret').focus();
                }
            });

            $('#addKeyCancel').click(function () {
                clearAddFields();
            });

            let clearAddFields = function () {
                $('#keyAccount').val('');
                $('#keySecret').val('');
            };

            $('#edit').click(function () {
                toggleEdit();
            });
            $('#export').click(function () {
                // exportAccounts();
            });
        };

        return {
            init: init,
            addAccount: addAccount,
            deleteAccount: deleteAccount
        };
    };

    // 下面这三句话应该是没用
    exports.StorageService = StorageService;
    exports.KeyUtilities = KeyUtilities;
    exports.KeysController = KeysController;

})(typeof exports === 'undefined' ? this['gauth'] = {} : exports);