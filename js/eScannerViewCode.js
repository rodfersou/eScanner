/**
 * eScanner - Visualizador de C�digo-Fonte
 * Relaciona os resultados da an�lise �s linhas de c�digo.
 * Exibe tamb�m uma visualiza��o do c�digo numa estrutura de �rvore radial.
 *
 * @author Victor Adriel de J. Oliveira
 */

(function(){
	$("div.resanalise").hide();
	redisplay();

	try{ gerartree(localStorage['jsonCode']); }
	catch(err){ $("#chart").html("<center><h3>N�o foi poss�vel gerar a representa��o do c�digo em �rvore.</h3></center>"); }
	$(".code").text(localStorage['htmlCode']);
	$("#pagName a").text(localStorage['pageName']).attr("href",localStorage['pageName']);
	var erros = JSON.parse(localStorage['errosArray']);
	var lineHeight = 19;
	
	// Marca ocorr�ncias
	for ( var i = 1; i < erros.length; i++ ){								
		if((erros[i].tipo == 0)&&(erros[i].ocorrencia > 0)){
			// Transforma string e deixa apenas numeros e virgulas
			var from = erros[i].linha.indexOf(":");
			var to = erros[i].linha.indexOf(".");
			var linhas = erros[i].linha.substring(from+1,to);
			linhas = linhas.replace(" e",",");
			// Verifica se h� um ou mais numeros na string
			var ifcoma = linhas.indexOf(",");
			if(ifcoma == -1){
				$(".code").prepend("<div class='boxlinha' style='margin-top:"+ (linhas-1)*lineHeight +"px'><span>"+ erros[i].descricao +"</span></div>");
			} else {
				linhas = linhas.split(",");
				for(var j = 0; j < linhas.length; j++){
					$(".code").prepend("<div class='boxlinha' style='margin-top:"+ (linhas[j]-1)*lineHeight +"px'><span>"+ erros[i].descricao +"</span></div>");
				}
			}
		}
	}
	
	// Exibindo resultado da an�lise	
	$(".mensagens .resanalise").css("overflow-y","scroll");
	$("#erros, #alertas").hide();
	
	var contEr = 0, contAl=0;
	for ( var i = 1; i < erros.length; i++ ){
		if((erros[i].tipo == 0)&&(erros[i].ocorrencia > 0)){
			contEr++;
			erros[i].linha = formataLinhas(erros[i].ocorrencia, erros[i].linha);
			$(".grupoErros").append("<div class='item erro'><a href='#'></a><p>"+ erros[i].descricao + "</p><div class='detalhes'>" + erros[i].detalhe +"</div></div>");
		}
		else if((erros[i].tipo == 1)&&(erros[i].ocorrencia > 0)){
			contAl++;
			$(".grupoAlertas").append("<div class='item alerta'><a href='#'></a><p>"+ erros[i].descricao + "</p><div class='detalhes'>" + erros[i].detalhe +"</div></div>");
		}
	}
	
	if(contEr == 1) $("#resumo ul li a:first").html(contEr + " erro");
	else $("#resumo ul li a:first").html(contEr + " erros");
	
	if(contAl == 1) $("#resumo ul li a:last").html(contAl + " alerta"); 
	else $("#resumo ul li a:last").html(contAl + " alertas"); 
	
	if (contEr > 0) $("#erros").show();
	if (contAl > 0) $("#alertas").show();
	$(".detalhes").hide();
	
	$(".grupoErros a, .grupoAlertas a").toggle(
		function(){
			$(this).parent().find(".detalhes").slideDown();
			$(this).css("background","url(../images/minus.png)");
		},
		function(){
			$(this).parent().find(".detalhes").slideUp();
			$(this).css("background","url(../images/plus.png)");
		}
	);
	
	// Exibir/esconder descri��o do erro na linha
	$(".code").find(".boxlinha span").hide();
	$(".code").find(".boxlinha").mouseover(function(){
		var off = $(this).offset();
		if(off.top <= 95) $(this).find("span").css("margin-top","19px").show();
		else $(this).find("span").css("margin-top","-19px").show();
	}).mouseleave(function(){
		$(this).find("span").hide();
	});

	function gerartree(jsontext){			
		var treeHeight = $("div.json").height();
		var treeWidth = $("div.json").width();
		var radius = treeWidth/2;

		var tree = d3.layout.tree()
			.size([360, radius - 60])
			.separation(function(a, b) { return (a.parent == b.parent ? 1 : 2) / a.depth; });

		var diagonal = d3.svg.diagonal.radial()
			.projection(function(d) { return [d.y, d.x / 180 * Math.PI]; });

		var vis = d3.select("#chart").append("svg")
			.attr("width", treeWidth)
			.attr("height", treeHeight)
			.append("g")
			.attr("transform", "translate(" + treeWidth/2 + "," + treeHeight/2 + ")");
		
		json = JSON.parse(jsontext);
		var nodes = tree.nodes(json);

		var link = vis.selectAll("path.link")
			.data(tree.links(nodes))
			.enter().append("path")
			.attr("class", "link")
			.attr("d", diagonal);

		var node = vis.selectAll("g.node")
			.data(nodes)
			.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")"; });
		  
		node.append("circle")
			.attr("r", treeWidth/90)
			.style("stroke",function(d){ 
				if(d.error == "1") return "#F00"; // border changes
				else return "steelblue";
			})
			.style("fill",function(d){ 
				if(d.error == "1") return "#F00"; // background changes
				else return "#fff";
			})
			.style("cursor", function(d){
				if(d.row != -1){
					return "pointer" ;
				}
			})
			.on("click", function(d){
				if(d.row != -1){
					$(".code").prepend("<div id='destaque' class='boxlinhaflash' style='margin-top:"+ (d.row - 1)*lineHeight +"px'>_</div>");
					var alt = $(".code").find("#destaque").height();
					$(".code").scrollTop(alt*(d.row-1));
					$(".code").find("#destaque").fadeOut(1000);
				}
			});

		node.append("text")
			.attr("dx", function(d) { return d.x < 180 ? 12 : -12; })
			.attr("dy", ".30em")
			.attr("text-anchor", function(d) { return d.x < 180 ? "start" : "end"; })
			.attr("transform", function(d) { return d.x < 180 ? null : "rotate(180)"; })
			.text(function(d) { return d.name; });
	}
	
	$("a.treecode").click(function(){
		if(localStorage['viewCode'] == 1){
			localStorage['viewCode'] = 0;
			redisplay();
		}else{
			localStorage['viewCode'] = 1;
			redisplay();
		}
	});
	
	$("a.infocode").click(function(){
		if(localStorage['viewCode'] == 2){
			localStorage['viewCode'] = 0;
			redisplay();
		}else{
			localStorage['viewCode'] = 2;
			redisplay();
		}
	});
	
	function redisplay(){		
		if(localStorage['viewCode'] == 0){
			$(".code").css("width","98%");
			$("div.json, div.resanalise").hide();
			$(".treec, .infoc").removeClass("ativo");
		}else if(localStorage['viewCode'] == 1){
			$(".code").css("width","49%");
			$("div.resanalise").hide();
			$("div.json").show();
			$(".infoc").removeClass("ativo");
			$(".treec").addClass("ativo");
		}else{
			$(".code").css("width","69%");
			$("div.json").hide();
			$("div.resanalise").show();
			$(".treec").removeClass("ativo");
			$(".infoc").addClass("ativo");
		}
	}
	
	function formataLinhas(ocorrencia, linha){
		// Substitui ultima virgula por ponto
		var num = linha.lastIndexOf(",");
		linha = linha.slice(0,num).concat(".");
		
		if(ocorrencia > 1){
			// Substitui penultima virgula pela conun��o 'e'
			num = linha.lastIndexOf(",");
			num2 = linha.lastIndexOf(".");
			st = linha.slice(0,num).concat(" e");
			linha = st.concat(linha.slice(num+1,num2+1));
		}
		else if(ocorrencia == 1){
			linha = linha.replace("nas linhas","na linha");
		}
		
		return linha;
	}
	
	$(window).resize(function(){
		window.location.reload();
	});
	
	$(".mensagens .code").scroll(function(){
		var position = $(".mensagens .code").find(".boxlinha").position();
		if(position.top < -15){ 
			$(".mensagens .code").css("box-shadow","inset -10px 0px 10px #000000");
		}
		else{ 
			$(".mensagens .code").css("box-shadow","none");
		}
	});
})();
