import { Injectable } from '@angular/core'
import { HttpClient, HttpHeaders } from '@angular/common/http'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable({ providedIn: 'root' })
export class SoapClientService {
	constructor(private http: HttpClient) {}

	/**
	 * Realiza una petición SOAP
	 */
	call(endpoint: string, operation: string, body: string): Observable<any> {
		const soapEnvelope = this.buildSoapEnvelope(operation, body)
		
		const headers = new HttpHeaders({
			'Content-Type': 'text/xml; charset=utf-8',
			'SOAPAction': `http://tempuri.org/I${this.getServiceName(endpoint)}/${operation}`
		})

		return this.http.post(endpoint, soapEnvelope, { 
			headers, 
			responseType: 'text' 
		}).pipe(
			map(xml => this.parseResponse(xml, operation))
		)
	}

	/**
	 * Construye el SOAP Envelope
	 */
	private buildSoapEnvelope(operation: string, body: string): string {
		return `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
               xmlns:tem="http://tempuri.org/"
               xmlns:dat="http://schemas.datacontract.org/2004/07/ChatComunitario.SoapServices"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <tem:${operation}>
      <tem:request>
        ${body}
      </tem:request>
    </tem:${operation}>
  </soap:Body>
</soap:Envelope>`
	}

	/**
	 * Extrae el nombre del servicio del endpoint
	 */
	private getServiceName(endpoint: string): string {
		const match = endpoint.match(/\/(\w+)\.svc/)
		return match ? match[1] : 'Service'
	}

	/**
	 * Parsea la respuesta SOAP XML a JSON
	 */
	private parseResponse(xml: string, operation: string): any {
		const parser = new DOMParser()
		const xmlDoc = parser.parseFromString(xml, 'text/xml')
		
		console.log('[SOAP] Raw XML Response:', xml)
		
		// Buscar el elemento de respuesta
		const responseNode = xmlDoc.getElementsByTagName(`${operation}Response`)[0]
		if (!responseNode) {
			console.error('No se encontró el nodo de respuesta:', `${operation}Response`)
			console.log('Available tags:', Array.from(xmlDoc.getElementsByTagName('*')).map(el => el.tagName))
			return null
		}

		// Convertir XML a objeto JSON
		const result = this.xmlToJson(responseNode)
		console.log('[SOAP] Parsed Result:', result)
		return result
	}

	/**
	 * Convierte un nodo XML a objeto JSON
	 */
	private xmlToJson(xml: Element): any {
		let obj: any = {}

		// Atributos
		if (xml.attributes && xml.attributes.length > 0) {
			obj['@attributes'] = {}
			for (let i = 0; i < xml.attributes.length; i++) {
				const attribute = xml.attributes[i]
				obj['@attributes'][attribute.nodeName] = attribute.nodeValue
			}
		}

		// Nodos hijos
		if (xml.hasChildNodes()) {
			let hasElements = false
			for (let i = 0; i < xml.childNodes.length; i++) {
				const item = xml.childNodes[i]
				// Quitar namespace del nombre del nodo (ej: ddp1:Success -> Success)
				let nodeName = item.nodeName
				if (nodeName.includes(':')) {
					nodeName = nodeName.split(':')[1]
				}

				if (item.nodeType === 1) { // Element node
					hasElements = true
					const childValue = this.xmlToJson(item as Element)
					
					if (typeof obj[nodeName] === 'undefined') {
						obj[nodeName] = childValue
					} else {
						if (typeof obj[nodeName].push === 'undefined') {
							const old = obj[nodeName]
							obj[nodeName] = []
							obj[nodeName].push(old)
						}
						obj[nodeName].push(childValue)
					}
				} else if (item.nodeType === 3) { // Text node
					const text = item.nodeValue?.trim()
					if (text && !hasElements) {
						// Si solo tiene un nodo de texto, retornar directamente
						return text
					}
				}
			}
		}

		return obj
	}

	/**
	 * Helper para construir el cuerpo XML de una petición
	 */
	buildRequestBody(params: Record<string, any>): string {
		let xml = ''
		
		// Ordenar alfabéticamente las keys (DataContractSerializer lo requiere)
		const sortedKeys = Object.keys(params).sort((a, b) => {
			const aCapitalized = a.charAt(0).toUpperCase() + a.slice(1)
			const bCapitalized = b.charAt(0).toUpperCase() + b.slice(1)
			return aCapitalized.localeCompare(bCapitalized)
		})
		
		for (const key of sortedKeys) {
			const value = params[key]
			if (value !== null && value !== undefined) {
				const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
				xml += `<dat:${capitalizedKey}>${this.escapeXml(String(value))}</dat:${capitalizedKey}>\n`
			}
		}
		return xml
	}

	/**
	 * Escapa caracteres especiales XML
	 */
	private escapeXml(unsafe: string): string {
		return unsafe
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&apos;')
	}
}
