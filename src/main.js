'use strict';

var transform = function () {
    var output = {};

    /**
     * Запрос данных на сервере.
     * @param {string} url
     * @param success - callback в случае успешного получения данных.
     * @param fail - callback в случае возникнования ошибки.
     */
    var request = function( url, success, fail ) {
        var req = new XMLHttpRequest();
        req.open( 'GET', url, true );

        req.addEventListener( 'load', function() {
            if ( req.status === 200 ) {
                success( req.responseText );
            } else if ( req.status >= 400 ) {
                fail( new Error( 'Ресурс не найден' ) );
            }
        } );

        req.addEventListener( 'error', function() {
            fail( new Error( 'Нет соединения с сетью' ) );
        } );

        req.send( null );
    };

    /**
     * Конвертация JSON строки в объект.
     * @param {string} message
     * @return {Object|boolean}
     */
    var jsonToObject = function( message ) {
        try {
            return JSON.parse( message );
        } catch ( e ) {
            showError( new Error( 'Неверный формат полученных данных' ) );
            return false;
        }
    };

    /**
     * Получить параметр с ключем param из объекта obj.
     * Если передан callback, то значение параметра будет им обработано.
     * @param {string} param
     * @param {Object} obj
     * @param {Function=} callback - Функция, через которую нужно прогнать полученный параметр.
     * @return {*}
     */
    var getParam = function( param, obj, callback ) {
        if ( param in obj ) {
            var value = obj[ param ];
            return ( callback ? callback( value ) : value );
        }

        return null;
    };

    /**
     * Форматирование даты в удобочитаемый вид.
     * @param date
     * @return {string}
     */
    var formatDate = function( date ) {
        var objDate = new Date( Date.parse( date ) );
        return objDate.toLocaleString()
    };

    /**
     * Получить вариант на русском языке.
     * @param {string} data
     * @return {*}
     */
    var formatRegion = function( data ) {
        switch ( data ) {
            case 'Region':
                return 'Регион';
            case 'City':
                return 'Город';
            default:
                return data;
        }
    };

    /**
     * Получить данные для ветки "Основные".
     * @param {Object} data
     */
    var getMain = function( data ) {
        var obj = {};

        if ( typeof data !== 'object' ) {
            return obj;
        }

        var options = {
            'UpdateDate': {
                'title': 'Дата обновления',
                'callback': formatDate
            },
            'Type': { 'title': 'Тип' },
            'GlobalCode_Value': { 'title': 'GlobalCode_Value' }
        };

        for ( var key in options ) {
            if ( !('title' in options[ key ]) ) {
                showError( new Error ( 'Не верный формат настроект. У ' + key + ' отсутствует поле title.' ) );
                continue;
            }

            var title = options[ key ][ 'title' ],
                callback = options[ key ][ 'callback' ],
                value;

            value = getParam( key, data, callback );
            if ( value ) {
                obj[ title ] = value;
            }
        }

        return obj;
    };

    /**
     * Получить данные для ветки "Регионы".
     * @param {Array} data
     * @return {Object}
     */
    var getRegions = function( data ) {
        var obj = {};

        if ( !Array.isArray( data ) ) {
            return obj;
        }

        for ( var i = 0, l = data.length; i < l; ++i ) {
            var region = data[ i ],
                title = getParam( 'Title', region );

            if ( title ) {
                var meta = {};
                meta[ 'Тип' ] = getParam( 'RegionType', region, formatRegion );
                meta[ 'КЛАДР' ] = getParam( 'KladrCode', region );
                obj[ title ] = meta;
            }
        }

        return obj;
    };

    /**
     * Получить данные для ветки "Сайт".
     * @param {Array} data
     */
    var getSite = function ( data ) {
        var obj = {};

        if ( !Array.isArray( data ) ) {
            return obj;
        }

        for ( var i = 0, l = data.length; i < l; ++i ) {
            var site = data[ i ],
                segment = getParam( 'Alias', site.Segment );

            if ( segment ) {
                var meta = {};
                meta[ 'Заголовок' ] = getParam( 'Title', site );
                meta[ 'Шаблон' ] = getParam( 'Template', site );
                obj[ segment ] = meta;
            }
        }

        return obj;
    };

    /**
     * Получить данные для ветки "Продукт".
     * @param {Object} data
     */
    var getProduct = function ( data ) {
        var obj = {},
            i = 0,
            l = 0,
            item = null,
            meta = null,
            group = null,
            newGroup = null;

        if ( typeof data !== 'object' ) {
            return obj;
        }

        if ( 'Title' in data ) {
            obj[ 'Заголовок' ] = getParam( 'Title', data );
        }

        if ( 'Description' in data ) {
            obj[ 'Описание' ] = getParam( 'Description', data );
        }

        if ( 'FullDescription' in data ) {
            obj[ 'Полное описание' ] = getParam( 'FullDescription', data );
        }

        if ( 'Type' in data ) {
            obj[ 'Тип' ] = getParam( 'Type', data );
        }

        if ( 'ServiceType' in data ) {
            obj[ 'Тип услуги' ] = getParam( 'Title', data[ 'ServiceType' ] );
        }

        if ( 'Zone' in data && 'Title' in data.Zone ) {
            obj[ 'Зона' ] = getParam( 'Title', data.Zone );
        }

        if ( 'Link' in data ) {
            obj[ 'Ссылка' ] = getParam( 'Link', data );
        }

        if ( 'Segment' in data && Array.isArray( data.Segment ) ) {
            group = data.Segment;
            newGroup = [];

            for ( i = 0, l = group.length; i < l; ++i ) {
                newGroup.push( getParam( 'Title', group[ i ] ) );
            }

            if ( newGroup.length ) {
                obj[ 'Сегмент' ] = newGroup;
            }
        }

        if ( 'Category' in data && Array.isArray( data.Category ) ) {
            group = data.Category;
            newGroup = {};

            for ( i = 0, l = group.length; i < l; ++i ) {
                item = group[ i ];
                meta = {};

                if ( 'CommunicationType' in item ) {
                    meta[ 'Тип коммуникации' ] = getParam( 'Title', item[ 'CommunicationType'] );
                }

                if ( 'Segment' in item ) {
                    meta[ 'Сегмент' ] = getParam( 'Title', item[ 'Segment'] );
                }

                newGroup[ item[ 'Title' ] ] = meta;
            }

            if ( Object.keys( newGroup ).length ) {
                obj[ 'Категории' ] = newGroup;
            }
        }

        if ( 'Groups' in data && Array.isArray( data.Groups ) ) {
            group = data.Groups;
            newGroup = {};

            for ( i = 0, l = group.length; i < l; ++i ) {
                item = group[ i ];
                meta = {};

                if ( 'Description' in item ) {
                    meta[ 'Описание' ] = getParam( 'Description', item );
                }

                if ( 'QuotaType' in item ) {
                    meta[ 'Тип квоты' ] = getParam( 'Title', item[ 'QuotaType' ] );
                }

                if ( 'Parent' in item ) {
                    var parent = item[ 'Parent' ];
                    var path = '/';

                    while ( parent ) {
                        path += parent[ 'Title' ] + '/';
                        parent = parent[ 'Parent' ];
                    }

                    meta[ 'Родитель' ] = path;
                }

                var title = ( 'ScreenName' in item ? item[ 'ScreenName' ] : item[ 'Title' ] );
                newGroup[ title ] = meta;
            }

            if ( Object.keys( newGroup ).length ) {
                obj[ 'Группы' ] = newGroup;
            }
        }

        if ( 'Modifiers' in data && Array.isArray( data.Modifiers ) ) {
            group = data.Modifiers;
            newGroup = [];

            for ( i = 0, l = group.length; i < l; ++i ) {
                item = group[ i ];
                newGroup.push( item[ 'Title' ] )
            }

            if ( Object.keys( newGroup ).length ) {
                obj[ 'Модификаторы' ] = newGroup;
            }
        }

        if ( 'Parameters' in data && Array.isArray( data.Parameters ) ) {
            group = data.Parameters;
            newGroup = {};

            for ( i = 0, l = group.length; i < l; ++i ) {
                item = group[ i ];
                meta = {};

                meta[ 'Базовый параметр' ] = getParam( 'Title', item[ 'BaseParameter' ] );

                if ( 'Group' in item ) {
                    meta[ 'Группа' ] = getParam( 'Title', item[ 'Group' ] );
                }

                if ( 'Value' in item ) {
                    meta[ 'Значение' ] = getParam( 'Value', item );
                }

                newGroup[ item[ 'Title' ] ] = meta;
            }

            if ( Object.keys( newGroup ).length ) {
                obj[ 'Параметры' ] = newGroup;
            }
        }

        return obj;
    };

    /**
     * Получить данные для ветки "Модификаторы"
     * @param {Array} data
     */
    var getModifiers = function ( data ) {
        var obj = [];

        if ( !Array.isArray( data ) ) {
            return obj;
        }

        for ( var i = 0, l = data.length; i < l; ++i ) {
            var item = data[ i ];
            if ( item[ 'Title' ] ) {
                obj.push( item[ 'Title' ] );
            }
        }

        return obj;
    };

    /**
     * Получить данные для ветки "Параметры"
     * @param {Array} data
     */
    var getParameters = function ( data ) {
        var obj = [];

        if ( !Array.isArray( data ) ) {
            return obj;
        }

        for ( var i = 0, l = data.length; i < l; ++i ) {
            var item = data[ i ],
                meta = {};

            if ( 'BaseParameter' in item ) {
                meta[ 'Основной параметр' ] = getParam( 'Title', item[ 'BaseParameter' ] );
            }

            if ( 'BaseParameterModifiers' in item && Array.isArray( item[ 'BaseParameterModifiers' ] ) ) {
                var parameterModifiers = item[ 'BaseParameterModifiers' ],
                    modifiers = [];
                for ( var p = 0, pl = parameterModifiers.length; p < pl; ++p ) {
                    if ( 'Title' in parameterModifiers[ p ] ) {
                        modifiers.push( parameterModifiers[ p ][ 'Title' ] )
                    }
                }

                meta[ 'Модификаторы' ] = modifiers;
            }

            if ( 'Group' in item ) {
                meta[ 'Группа' ] = getParam( 'Title', item[ 'Group' ] );
            }

            if ( 'Title' in item ) {
                meta[ 'Заголовок' ] = getParam( 'Title', item );
            }

            if ( 'Zone' in item ) {
                meta[ 'Зона' ] = getParam( 'Title', item[ 'Zone' ] );
            }

            if ( 'Value' in item ) {
                meta[ 'Значение' ] = getParam( 'Value', item );
            }

            if ( 'Unit' in item ) {
                meta[ 'Переодичность оплаты' ] = getParam( 'QuotaPeriodicity', item[ 'Unit' ] );
                meta[ 'Валюта' ] = getParam( 'Title', item[ 'Unit' ] );
                meta[ 'Валюта для вывода' ] = getParam( 'Display', item[ 'Unit' ] );
            }

            obj.push( meta );

        }

        return obj;
    };

    /**
     * Получить данные для ветки "Тарифы"
     * @param {Array} data
     * @return {Array}
     */
    var getTariffs = function( data ) {
        var obj = [];

        if ( !Array.isArray( data ) ) {
            return obj;
        }

        for ( var i = 0, l = data.length; i < l; ++i ) {
            var item = data[ i ],
                title = '',
                p, lp,
                list = [],
                meta = [];

            title = item[ 'Tariff' ][ 'MarketingProduct' ][ 'Title' ];

            meta[ 'Название' ] = title;
            meta[ 'Описание' ] = item[ 'Parent' ][ 'Title' ];

            if ( 'Modifiers' in item[ 'Parent' ] && Array.isArray( item[ 'Parent' ][ 'Modifiers' ] ) ) {
                var modifiers = item[ 'Parent' ][ 'Modifiers' ];
                for ( p = 0, lp = modifiers.length; p < lp; ++p ) {
                    list.push( getParam( 'Title', modifiers[ p ] ) );
                }

                meta[ 'Модификаторы' ] = list;
            }

            if ( 'Parameters' in item[ 'Parent' ] && Array.isArray( item[ 'Parent' ][ 'Parameters' ] ) ) {
                list = [];
                var parameters = item[ 'Parent' ][ 'Parameters' ];
                for ( p = 0, lp = parameters.length; p < lp; ++p ) {
                    list.push( getParam( 'Title', parameters[ p ] ) );
                }

                meta[ 'Параметры' ] = list;
            }

            obj.push( meta )
        }

        return obj;
    };

    /**
     * Трансформируем полученные данные.
     * @param {string} message - JSON строка.
     */
    var transformJson = function( message ) {
        var obj = jsonToObject( message );
        if ( obj ) {
            output[ 'Основные' ] = getMain( obj );

            if ( 'Regions' in obj ) {
                output[ 'Регионы' ] = getRegions( obj.Regions );
            }

            if ( 'MTSSiteUrlTemplate' in obj ) {
                output[ 'Сайт' ] = getSite( obj.MTSSiteUrlTemplate );
            }

            if ( 'MarketingProduct' in obj ) {
                output[ 'Продукт' ] = getProduct( obj.MarketingProduct );
            }

            if ( 'Modifiers' in obj ) {
                output[ 'Модификаторы' ] = getModifiers( obj.Modifiers );
            }

            if ( 'Parameters' in obj ) {
                output[ 'Параметры' ] = getParameters( obj.Parameters );
            }

            if ( 'TariffsOnService' in obj ) {
                output[ 'Тарифы' ] = getTariffs( obj.TariffsOnService );
            }
        }

        console.log( obj );
        console.log( output );
    };

    /**
     * Вывод ошибки.
     * @param {Error} error
     */
    var showError = function( error ) {
        console.log( 'Ошибка: ' + error.message );
    };

    /**
     * Внешний интерфейс
     */
    return {
        start: function( url ) {
            request( url, transformJson, showError );
        }
    }
}();
